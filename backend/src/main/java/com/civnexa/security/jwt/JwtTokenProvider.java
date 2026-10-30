package com.civnexa.security.jwt;

import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Production-ready JWT Token Provider for CIVNEXA.
 * Generates and validates stateless access tokens signed with HMAC-SHA256 (HS256).
 * Enforces strict cryptographic signature checks, algorithm validation, expiration, and issuer verification.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);
    private static final String EXPECTED_ALGORITHM = "HS256";

    private final JwtProperties jwtProperties;
    private SecretKey signingKey;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    @PostConstruct
    public void init() {
        this.signingKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a signed access token for an authenticated user.
     * Uses the institutional user reference as subject (not email) and includes minimal role information.
     *
     * @param user The authenticated active user
     * @return Compact signed JWT string
     */
    public String generateToken(User user) {
        if (user == null || user.getUserReference() == null) {
            throw new IllegalArgumentException("User and user reference cannot be null for token generation");
        }

        Instant now = Instant.now();
        Instant expiryInstant = now.plusMillis(jwtProperties.getExpirationMs());
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .header()
                    .type("JWT")
                    .and()
                .id(jti)
                .subject(user.getUserReference())
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiryInstant))
                .claim("role", user.getRole().name())
                .claim("userRef", user.getUserReference())
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Generates a token with an explicit expiration for testing scenarios (e.g. testing expired tokens).
     */
    public String generateTokenWithCustomExpiration(User user, long customExpirationMs) {
        Instant now = Instant.now();
        Instant expiryInstant = now.plusMillis(customExpirationMs);
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .header()
                    .type("JWT")
                    .and()
                .id(jti)
                .subject(user.getUserReference())
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiryInstant))
                .claim("role", user.getRole().name())
                .claim("userRef", user.getUserReference())
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Parses and validates a JWT, returning the signed claims.
     *
     * @param token Compact signed JWT string
     * @return Validated Claims payload
     * @throws JwtException if the token is invalid, expired, malformed, or untrusted
     */
    public Claims parseAndValidateClaims(String token) {
        if (token == null || token.trim().isEmpty()) {
            throw new MalformedJwtException("JWT token string is null or empty");
        }

        Jws<Claims> jws = Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(jwtProperties.getIssuer())
                .build()
                .parseSignedClaims(token.trim());

        // Defense-in-depth: Reject any algorithm other than HS256
        String alg = jws.getHeader().getAlgorithm();
        if (!EXPECTED_ALGORITHM.equalsIgnoreCase(alg)) {
            throw new UnsupportedJwtException("Unsupported JWT algorithm: " + alg + "; expected HS256");
        }

        Claims claims = jws.getPayload();

        // Validate mandatory claims
        if (claims.getSubject() == null || claims.getSubject().trim().isEmpty()) {
            throw new MalformedJwtException("JWT subject claim is missing");
        }
        if (claims.getId() == null || claims.getId().trim().isEmpty()) {
            throw new MalformedJwtException("JWT ID (jti) claim is missing");
        }
        String roleStr = claims.get("role", String.class);
        if (roleStr == null || roleStr.trim().isEmpty()) {
            throw new MalformedJwtException("JWT role claim is missing");
        }
        try {
            RoleType.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new MalformedJwtException("JWT role claim contains invalid role: " + roleStr);
        }

        return claims;
    }

    /**
     * Validates a JWT string safely without throwing exceptions.
     *
     * @param token Compact signed JWT string
     * @return true if token is completely valid; false otherwise
     */
    public boolean validateToken(String token) {
        try {
            parseAndValidateClaims(token);
            return true;
        } catch (ExpiredJwtException ex) {
            log.debug("JWT token is expired: {}", ex.getMessage());
        } catch (SignatureException ex) {
            log.warn("JWT token signature validation failed: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            log.debug("Malformed JWT token received: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT token received: {}", ex.getMessage());
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Invalid JWT token: {}", ex.getMessage());
        }
        return false;
    }

    /**
     * Extracts the subject (institutional user reference) from a valid token.
     */
    public String getUserReferenceFromToken(String token) {
        return parseAndValidateClaims(token).getSubject();
    }

    /**
     * Extracts the RoleType claim from a valid token.
     */
    public RoleType getRoleFromToken(String token) {
        String roleStr = parseAndValidateClaims(token).get("role", String.class);
        return RoleType.valueOf(roleStr);
    }

    /**
     * Extracts the expiration date from a valid token.
     */
    public Date getExpirationDateFromToken(String token) {
        return parseAndValidateClaims(token).getExpiration();
    }

    public long getExpirationMs() {
        return jwtProperties.getExpirationMs();
    }
}
