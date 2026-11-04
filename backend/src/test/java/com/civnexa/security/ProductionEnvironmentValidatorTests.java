package com.civnexa.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Production Environment Security & Operational Validator Tests")
public class ProductionEnvironmentValidatorTests {

    @Test
    @DisplayName("Verify dev and test profiles do not trigger strict production failure")
    void testDevProfilePermissive() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("test");
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatCode(validator::validateEnvironment).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Verify production fails when JWT_SECRET is missing or blank")
    void testProdFailsOnMissingJwtSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("civnexa.jwt.secret", "");
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatThrownBy(validator::validateEnvironment)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT signing secret (JWT_SECRET) is required");
    }

    @Test
    @DisplayName("Verify production fails when JWT_SECRET is a known test secret")
    void testProdFailsOnKnownInsecureJwtSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("civnexa.jwt.secret", "civnexa_test_isolated_secret_key_at_least_256_bits_long_for_test_environment_2026");
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatThrownBy(validator::validateEnvironment)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("known test/development secret");
    }

    @Test
    @DisplayName("Verify production fails when OTP HMAC secret equals JWT secret")
    void testProdFailsOnSharedSecretViolation() {
        String sharedSecret = "very_long_secure_random_key_of_at_least_32_characters_for_prod_1";
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("civnexa.jwt.secret", sharedSecret);
        env.setProperty("civnexa.otp.hmac-secret", sharedSecret);
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatThrownBy(validator::validateEnvironment)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Key separation violation");
    }

    @Test
    @DisplayName("Verify production fails when default OTP HMAC secret is detected")
    void testProdFailsOnDefaultOtpHmacSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("civnexa.jwt.secret", "valid_unique_production_jwt_secret_at_least_32_bytes_long_123");
        env.setProperty("civnexa.otp.hmac-secret", ProductionEnvironmentValidator.DEFAULT_DEV_OTP_HMAC);
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatThrownBy(validator::validateEnvironment)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Default development OTP HMAC secret detected");
    }

    @Test
    @DisplayName("Verify production fails when database password is root or missing")
    void testProdFailsOnDefaultDatabasePassword() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("civnexa.jwt.secret", "valid_unique_production_jwt_secret_at_least_32_bytes_long_123");
        env.setProperty("civnexa.otp.hmac-secret", "valid_unique_production_otp_hmac_secret_at_least_32_chars_123");
        env.setProperty("spring.datasource.password", "root");
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatThrownBy(validator::validateEnvironment)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Database password (SPRING_DATASOURCE_PASSWORD) cannot be blank or default 'root'");
    }

    @Test
    @DisplayName("Verify production fails when SMTP host is localhost or missing when email enabled")
    void testProdFailsOnLocalhostSmtp() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("civnexa.jwt.secret", "valid_unique_production_jwt_secret_at_least_32_bytes_long_123");
        env.setProperty("civnexa.otp.hmac-secret", "valid_unique_production_otp_hmac_secret_at_least_32_chars_123");
        env.setProperty("spring.datasource.password", "StrongProductionPassword2026!#");
        env.setProperty("civnexa.mail.enabled", "true");
        env.setProperty("spring.mail.host", "localhost");
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatThrownBy(validator::validateEnvironment)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Real institutional SMTP host (SPRING_MAIL_HOST) must be configured");
    }

    @Test
    @DisplayName("Verify production succeeds when all production configurations and secrets are valid")
    void testProdSucceedsWithValidConfig() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("civnexa.jwt.secret", "valid_unique_production_jwt_secret_at_least_32_bytes_long_123");
        env.setProperty("civnexa.otp.hmac-secret", "valid_unique_production_otp_hmac_secret_at_least_32_chars_123");
        env.setProperty("spring.datasource.password", "StrongProductionPassword2026!#");
        env.setProperty("civnexa.mail.enabled", "true");
        env.setProperty("spring.mail.host", "smtp.institution.edu");
        env.setProperty("spring.mail.properties.mail.smtp.starttls.enable", "true");
        ProductionEnvironmentValidator validator = new ProductionEnvironmentValidator(env);

        assertThatCode(validator::validateEnvironment).doesNotThrowAnyException();
    }
}
