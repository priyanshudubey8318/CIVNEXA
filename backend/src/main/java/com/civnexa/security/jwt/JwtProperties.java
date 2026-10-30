package com.civnexa.security.jwt;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Configuration properties for CIVNEXA JWT token generation and validation.
 * Enforces fail-fast validation on application startup ensuring cryptographic key strength.
 */
@Component
public class JwtProperties {

    public static final String DEFAULT_ISSUER = "CIVNEXA";
    public static final long DEFAULT_EXPIRATION_MS = 900_000L; // 15 minutes
    public static final int MIN_SECRET_BYTES = 32; // 256 bits required for HS256

    @Value("${civnexa.jwt.secret:${JWT_SECRET:}}")
    private String secret;

    @Value("${civnexa.jwt.expiration-ms:900000}")
    private long expirationMs = DEFAULT_EXPIRATION_MS;

    @Value("${civnexa.jwt.issuer:CIVNEXA}")
    private String issuer = DEFAULT_ISSUER;

    public JwtProperties() {
    }

    public JwtProperties(String secret, long expirationMs, String issuer) {
        this.secret = secret;
        this.expirationMs = expirationMs;
        this.issuer = issuer;
        validate();
    }

    @PostConstruct
    public void validate() {
        if (secret == null || secret.trim().isEmpty()) {
            throw new IllegalStateException("JWT signing secret (JWT_SECRET) must be configured and cannot be blank.");
        }
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("JWT signing secret must be at least 256 bits (32 UTF-8 bytes) in length for HS256.");
        }
        if (expirationMs <= 0) {
            throw new IllegalStateException("JWT expiration-ms must be greater than 0.");
        }
        if (issuer == null || issuer.trim().isEmpty()) {
            this.issuer = DEFAULT_ISSUER;
        }
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }
}
