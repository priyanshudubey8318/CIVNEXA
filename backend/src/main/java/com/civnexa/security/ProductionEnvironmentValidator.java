package com.civnexa.security;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

/**
 * Validates production environment readiness during Spring application startup.
 * Enforces fail-fast termination if required cryptographic secrets, database credentials,
 * or institutional SMTP parameters are missing, default, or insecure.
 */
@Component
public class ProductionEnvironmentValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionEnvironmentValidator.class);

    public static final String DEFAULT_DEV_OTP_HMAC = "civnexa_institutional_otp_hmac_secret_key_at_least_256_bits_for_sha256";
    public static final List<String> KNOWN_INSECURE_TEST_SECRETS = Arrays.asList(
            "civnexa_mysql_isolated_secret_key_at_least_256_bits_long_for_test_environment_2026",
            "civnexa_test_isolated_secret_key_at_least_256_bits_long_for_test_environment_2026",
            "dummy_secret_key_for_testing_purposes_only_32_bytes_long"
    );

    private final Environment environment;

    public ProductionEnvironmentValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateEnvironment() {
        boolean isProduction = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("prod") || p.equalsIgnoreCase("production"));

        if (!isProduction) {
            log.info("Development/Test profile active: non-production secret fallbacks permitted.");
            return;
        }

        log.info("Production profile detected ('prod'): initiating strict cryptographic and operational validation...");

        // 1. JWT Secret Hardening
        String jwtSecret = environment.getProperty("civnexa.jwt.secret");
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                    "Production startup aborted: JWT signing secret (JWT_SECRET) is required and cannot be blank.");
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                    "Production startup aborted: JWT signing secret (JWT_SECRET) must be at least 256 bits (32 UTF-8 bytes).");
        }
        for (String insecureSecret : KNOWN_INSECURE_TEST_SECRETS) {
            if (jwtSecret.trim().equals(insecureSecret)) {
                throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                        "Production startup aborted: A known test/development secret is configured for JWT_SECRET. " +
                        "Generate a unique cryptographically random 256-bit secret for production.");
            }
        }

        // 2. OTP HMAC Secret Hardening
        String otpHmacSecret = environment.getProperty("civnexa.otp.hmac-secret");
        if (otpHmacSecret == null || otpHmacSecret.trim().isEmpty()) {
            throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                    "Production startup aborted: OTP HMAC secret (CIVNEXA_OTP_HMAC_SECRET) is required.");
        }
        if (otpHmacSecret.trim().length() < 32) {
            throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                    "Production startup aborted: CIVNEXA_OTP_HMAC_SECRET must be at least 32 characters in length.");
        }
        if (otpHmacSecret.trim().equals(jwtSecret.trim())) {
            throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                    "Production startup aborted: Key separation violation. CIVNEXA_OTP_HMAC_SECRET must not share the same secret as JWT token signing.");
        }
        if (DEFAULT_DEV_OTP_HMAC.equals(otpHmacSecret.trim())) {
            throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                    "Production startup aborted: Default development OTP HMAC secret detected in production. " +
                    "Inject a dedicated random 256-bit secret via CIVNEXA_OTP_HMAC_SECRET.");
        }

        // 3. Database Credentials Hardening
        String dbPassword = environment.getProperty("spring.datasource.password");
        if (dbPassword == null || dbPassword.trim().isEmpty() || "root".equalsIgnoreCase(dbPassword.trim())) {
            throw new IllegalStateException("[CIVNEXA PRODUCTION SECURITY VIOLATION] " +
                    "Production startup aborted: Database password (SPRING_DATASOURCE_PASSWORD) cannot be blank or default 'root'.");
        }

        // 4. Institutional SMTP Email Validation
        String mailEnabled = environment.getProperty("civnexa.mail.enabled", "true");
        if ("true".equalsIgnoreCase(mailEnabled)) {
            String mailHost = environment.getProperty("spring.mail.host");
            if (mailHost == null || mailHost.trim().isEmpty() ||
                    "localhost".equalsIgnoreCase(mailHost.trim()) || "127.0.0.1".equals(mailHost.trim())) {
                throw new IllegalStateException("[CIVNEXA PRODUCTION OPERATIONAL VIOLATION] " +
                        "Production startup aborted: Real institutional SMTP host (SPRING_MAIL_HOST) must be configured when email is enabled. " +
                        "Localhost is only permitted in development/test profiles.");
            }

            String startTls = environment.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "false");
            if (!"true".equalsIgnoreCase(startTls)) {
                throw new IllegalStateException("[CIVNEXA PRODUCTION OPERATIONAL VIOLATION] " +
                        "Production startup aborted: STARTTLS must be enabled (SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true) for institutional email transmission.");
            }
        }

        log.info("Production environment cryptographic and operational verification completed successfully.");
    }
}
