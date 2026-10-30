package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.AuthResponse;
import com.civnexa.dto.LoginRequest;
import com.civnexa.dto.RegisterRequest;
import com.civnexa.dto.UserResponse;
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
 * Handles user login with JWT issuance, configurable student self-registration, and profile retrieval.
 */
@RestController
@RequestMapping({"/auth", "/api/v1/auth"})
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final LoginRateLimiter loginRateLimiter;

    @Value("${civnexa.auth.public-registration-enabled:false}")
    private boolean publicRegistrationEnabled;

    public AuthController(AuthService authService,
                          JwtTokenProvider jwtTokenProvider,
                          UserRepository userRepository,
                          LoginRateLimiter loginRateLimiter) {
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.loginRateLimiter = loginRateLimiter;
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
     * Public registration is disabled by default until institutional identity verification rollout.
     * When enabled, creates a student account in PENDING_VERIFICATION status without issuing access tokens.
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
                .body(ApiResponse.ok(userResponse, "Student registration submitted successfully. Account pending institutional verification."));
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

    public boolean isPublicRegistrationEnabled() {
        return publicRegistrationEnabled;
    }

    public void setPublicRegistrationEnabled(boolean publicRegistrationEnabled) {
        this.publicRegistrationEnabled = publicRegistrationEnabled;
    }
}
