package com.civnexa.security.jwt;

import com.civnexa.entity.User;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Filter that inspects every HTTP request for a Bearer JWT in the Authorization header.
 * Validates the token signature and expiration, and performs authoritative database account checks:
 * ensures the user exists and holds an ACTIVE status. Tokens for SUSPENDED, INACTIVE, or
 * PENDING_VERIFICATION users are rejected even if cryptographically valid.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = extractJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String userReference = tokenProvider.getUserReferenceFromToken(jwt);

                if (StringUtils.hasText(userReference)) {
                    // Authoritative DB verification: token is only valid if user exists and is ACTIVE
                    Optional<User> userOpt = userRepository.findByUserReference(userReference);

                    if (userOpt.isPresent()) {
                        User user = userOpt.get();

                        if (AuthService.STATUS_ACTIVE.equalsIgnoreCase(user.getStatus())) {
                            CivnexaUserPrincipal principal = CivnexaUserPrincipal.create(user);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            log.debug("Authenticated userRef={} with role={}", userReference, user.getRole());
                        } else {
                            log.debug("JWT rejected: userRef={} exists but status is {} (not ACTIVE)",
                                    userReference, user.getStatus());
                            SecurityContextHolder.clearContext();
                        }
                    } else {
                        log.debug("JWT rejected: userRef={} from valid token not found in database", userReference);
                        SecurityContextHolder.clearContext();
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not set user authentication in security context: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extracts Bearer token string from HTTP Authorization header.
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader(AUTHORIZATION_HEADER);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith(BEARER_PREFIX)) {
            return bearerToken.substring(BEARER_PREFIX.length()).trim();
        }
        return null;
    }
}
