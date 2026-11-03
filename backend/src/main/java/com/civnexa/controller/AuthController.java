package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.AuthResponse;
import com.civnexa.dto.ChangePasswordRequest;
import com.civnexa.dto.ForgotPasswordRequest;
import com.civnexa.dto.LoginRequest;
import com.civnexa.dto.RegisterRequest;
import com.civnexa.dto.ResendVerificationRequest;
import com.civnexa.dto.ResetPasswordRequest;
import com.civnexa.dto.UserResponse;
import com.civnexa.dto.VerifyEmailRequest;
import com.civnexa.entity.User;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.security.LoginRateLimiter;
import com.civnexa.security.jwt.JwtTokenProvider;
import com.civnexa.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing REST endpoints for CIVNEXA authentication and user identity.
 * Handles user login with JWT issuance, student self-registration, OTP verification, and profile retrieval.
 */
@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final LoginRateLimiter loginRateLimiter;
    private final com.civnexa.security.jwt.TokenBlacklistService tokenBlacklistService;

    @Value("${civnexa.auth.public-registration-enabled:true}")
    private boolean publicRegistrationEnabled;

    public AuthController(AuthService authService,
                          JwtTokenProvider jwtTokenProvider,
                          UserRepository userRepository,
                          LoginRateLimiter loginRateLimiter,
                          com.civnexa.security.jwt.TokenBlacklistService tokenBlacklistService) {
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.loginRateLimiter = loginRateLimiter;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    /**
     * Terminates session and places the bearer JWT onto the server-side revocation blacklist.
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            if (tokenBlacklistService != null) {
                tokenBlacklistService.revokeToken(token);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully. Institutional session revoked."));
    }

    /**
     * Authenticates active users via email and password, returning a signed JWT access token.
     * Protected against brute-force attacks via client IP rate limiting.
     *
     * @param request Login credentials
     * @param httpRequest Incoming HTTP servlet request for client IP evaluation
     * @return AuthResponse containing signed JWT, expiration, and user details
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        String clientIp = LoginRateLimiter.resolveClientIp(httpRequest);
        loginRateLimiter.checkRateLimit(clientIp);

        User user;
        try {
            user = authService.verifyUserCredentials(request);
            loginRateLimiter.resetAttempts(clientIp);
        } catch (Exception ex) {
            loginRateLimiter.recordAttempt(clientIp);
            throw ex;
        }

        String token = jwtTokenProvider.generateToken(user);
        long expiresInMs = jwtTokenProvider.getExpirationMs();

        AuthResponse authResponse = AuthResponse.of(token, expiresInMs, UserResponse.fromEntity(user));
        return ResponseEntity.ok(ApiResponse.ok(authResponse, "Authentication successful"));
    }

    /**
     * Handles student self-registration.
     * When enabled, creates a student account in PENDING_VERIFICATION status and dispatches an OTP challenge.
     *
     * @param request Student registration payload
     * @return UserResponse of newly registered student (status PENDING_VERIFICATION)
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        if (!publicRegistrationEnabled) {
            log.warn("Public self-registration rejected: public registration is currently disabled");
            throw new ApiException("Public student registration is currently disabled. Please contact institutional administration.",
                    HttpStatus.FORBIDDEN);
        }

        UserResponse userResponse = authService.registerStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(userResponse, "Student registration submitted successfully. Please verify your email with the 6-digit code."));
    }

    /**
     * Verifies the student's email with a 6-digit OTP code.
     * Transitions account to PENDING_APPROVAL on success.
     *
     * @param request Email and 6-digit OTP
     * @return UserResponse in PENDING_APPROVAL status
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<UserResponse>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        UserResponse userResponse = authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.ok(userResponse, "Email verified successfully. Your account is now pending institutional review."));
    }

    /**
     * Resends a fresh 6-digit verification code to the student's email.
     *
     * @param request Email payload
     * @return Confirmation message
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "A new verification code has been dispatched to your email address."));
    }

    /**
     * Returns the profile of the currently authenticated user.
     * Requires a valid Bearer token.
     *
     * @param principal The authenticated institutional principal
     * @param authentication The Spring Security authentication token
     * @return UserResponse of the authenticated user
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal CivnexaUserPrincipal principal,
                                                        Authentication authentication) {
        User user = null;
        if (principal != null) {
            user = principal.getUser();
        } else if (authentication != null && authentication.getPrincipal() instanceof User u) {
            user = u;
        } else if (authentication != null && authentication.getName() != null) {
            user = userRepository.findByUserReference(authentication.getName())
                    .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED));
        }

        if (user == null) {
            throw new ApiException("Authentication required", HttpStatus.UNAUTHORIZED);
        }

        return ResponseEntity.ok(ApiResponse.ok(UserResponse.fromEntity(user), "Current authenticated user profile retrieved successfully"));
    }

    /**
     * Changes password for the currently authenticated user.
     * Requires an authenticated session (Bearer JWT).
     *
     * @param request The password change payload
     * @param principal The authenticated principal
     * @param authentication The Spring Security authentication
     * @return UserResponse with updated status and passwordChangeRequired=false
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<UserResponse>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal,
            Authentication authentication) {
        User user = null;
        if (principal != null) {
            user = principal.getUser();
        } else if (authentication != null && authentication.getPrincipal() instanceof User u) {
            user = u;
        } else if (authentication != null && authentication.getName() != null) {
            user = userRepository.findByUserReference(authentication.getName())
                    .orElse(null);
            if (user == null) {
                user = userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
            }
        }

        if (user == null) {
            throw new ApiException("Authentication required to change password", HttpStatus.UNAUTHORIZED);
        }

        UserResponse userResponse = authService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(userResponse, "Password changed successfully"));
    }

    /**
     * Initiates a password reset request by dispatching a 6-digit OTP code to the provided email.
     *
     * @param request The forgot password payload containing email
     * @return Confirmation message
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "If an institutional account exists with this email address, a password recovery code has been dispatched."));
    }

    /**
     * Completes password reset using a verified 6-digit OTP code and sets the new password.
     *
     * @param request The reset password payload containing email, OTP, newPassword, confirmPassword
     * @return UserResponse of updated user
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<UserResponse>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        UserResponse userResponse = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(userResponse, "Password has been reset successfully. You may now log in with your new password."));
    }

    public boolean isPublicRegistrationEnabled() {
        return publicRegistrationEnabled;
    }

    public void setPublicRegistrationEnabled(boolean publicRegistrationEnabled) {
        this.publicRegistrationEnabled = publicRegistrationEnabled;
    }
}
