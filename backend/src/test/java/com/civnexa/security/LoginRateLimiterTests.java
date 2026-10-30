package com.civnexa.security;

import com.civnexa.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.*;

public class LoginRateLimiterTests {

    private LoginRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        // 3 max attempts within 2 seconds for deterministic testing
        rateLimiter = new LoginRateLimiter(true, 3, 2);
    }

    @Test
    @DisplayName("Attempts under the configured threshold succeed without throwing exceptions")
    void testAttemptsUnderThresholdAllowed() {
        String clientIp = "192.168.1.50";

        assertDoesNotThrow(() -> rateLimiter.checkRateLimit(clientIp));
        rateLimiter.recordAttempt(clientIp);

        assertDoesNotThrow(() -> rateLimiter.checkRateLimit(clientIp));
        rateLimiter.recordAttempt(clientIp);

        assertDoesNotThrow(() -> rateLimiter.checkRateLimit(clientIp));
    }

    @Test
    @DisplayName("Exceeding max attempts throws ApiException with HTTP 429 Too Many Requests")
    void testExceedingMaxAttemptsThrows429() {
        String clientIp = "192.168.1.100";

        rateLimiter.recordAttempt(clientIp);
        rateLimiter.recordAttempt(clientIp);
        rateLimiter.recordAttempt(clientIp);

        ApiException ex = assertThrows(ApiException.class, () -> rateLimiter.checkRateLimit(clientIp));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertTrue(ex.getMessage().contains("Too many login attempts"));
    }

    @Test
    @DisplayName("Successful login resets failure history for the client")
    void testResetAttemptsClearsHistory() {
        String clientIp = "192.168.1.150";

        rateLimiter.recordAttempt(clientIp);
        rateLimiter.recordAttempt(clientIp);

        // Reset on success
        rateLimiter.resetAttempts(clientIp);

        // Should be able to make attempts again without hitting rate limit
        rateLimiter.recordAttempt(clientIp);
        rateLimiter.recordAttempt(clientIp);
        assertDoesNotThrow(() -> rateLimiter.checkRateLimit(clientIp));
    }

    @Test
    @DisplayName("Sliding window expiration permits new attempts after duration elapses")
    void testSlidingWindowExpiration() throws InterruptedException {
        // Fast 1 second window
        LoginRateLimiter fastLimiter = new LoginRateLimiter(true, 2, 1);
        String clientIp = "10.0.0.1";

        fastLimiter.recordAttempt(clientIp);
        fastLimiter.recordAttempt(clientIp);

        // Assert blocked immediately
        assertThrows(ApiException.class, () -> fastLimiter.checkRateLimit(clientIp));

        // Wait for window to expire (> 1000ms)
        Thread.sleep(1100);

        // Window expired; check should pass
        assertDoesNotThrow(() -> fastLimiter.checkRateLimit(clientIp));
    }

    @Test
    @DisplayName("Disabled rate limiter permits unlimited attempts")
    void testDisabledRateLimiter() {
        rateLimiter.setEnabled(false);
        String clientIp = "172.16.0.1";

        for (int i = 0; i < 10; i++) {
            rateLimiter.recordAttempt(clientIp);
            assertDoesNotThrow(() -> rateLimiter.checkRateLimit(clientIp));
        }
    }

    @Test
    @DisplayName("Client IP resolution correctly inspects X-Forwarded-For and RemoteAddr")
    void testClientIpResolution() {
        MockHttpServletRequest requestWithProxy = new MockHttpServletRequest();
        requestWithProxy.addHeader("X-Forwarded-For", "203.0.113.195, 70.41.3.18, 150.172.238.178");
        requestWithProxy.setRemoteAddr("127.0.0.1");

        assertEquals("203.0.113.195", LoginRateLimiter.resolveClientIp(requestWithProxy));

        MockHttpServletRequest requestDirect = new MockHttpServletRequest();
        requestDirect.setRemoteAddr("198.51.100.42");

        assertEquals("198.51.100.42", LoginRateLimiter.resolveClientIp(requestDirect));

        assertEquals("unknown", LoginRateLimiter.resolveClientIp(null));
    }
}
