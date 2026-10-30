package com.civnexa.security;

import com.civnexa.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * In-memory sliding-window rate limiter for protecting authentication endpoints against brute-force attacks.
 * Tracks login attempts by client IP address to prevent permanent account lockout of legitimate users.
 * Configurable via 'civnexa.security.rate-limit.login'.
 */
@Component
public class LoginRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimiter.class);

    @Value("${civnexa.security.rate-limit.login.enabled:true}")
    private boolean enabled = true;

    @Value("${civnexa.security.rate-limit.login.max-attempts:5}")
    private int maxAttempts = 5;

    @Value("${civnexa.security.rate-limit.login.window-seconds:60}")
    private int windowSeconds = 60;

    // Map of client identifier -> Deque of attempt timestamps
    private final Map<String, ConcurrentLinkedDeque<Instant>> attempts = new ConcurrentHashMap<>();

    public LoginRateLimiter() {
    }

    public LoginRateLimiter(boolean enabled, int maxAttempts, int windowSeconds) {
        this.enabled = enabled;
        this.maxAttempts = maxAttempts;
        this.windowSeconds = windowSeconds;
    }

    /**
     * Asserts that the client has not exceeded the permitted login attempts within the configured window.
     * Throws {@link ApiException} with HTTP 429 Too Many Requests if rate limited.
     */
    public void checkRateLimit(String clientKey) {
        if (!enabled || clientKey == null || clientKey.isBlank()) {
            return;
        }

        cleanupOldAttempts(clientKey);

        ConcurrentLinkedDeque<Instant> clientAttempts = attempts.get(clientKey);
        if (clientAttempts != null && clientAttempts.size() >= maxAttempts) {
            log.warn("Rate limit exceeded for client [{}]. Attempts in window: {}", clientKey, clientAttempts.size());
            throw new ApiException("Too many login attempts. Please wait a few moments before trying again.",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    /**
     * Records an authentication attempt for the given client.
     */
    public void recordAttempt(String clientKey) {
        if (!enabled || clientKey == null || clientKey.isBlank()) {
            return;
        }

        Instant now = Instant.now();
        attempts.computeIfAbsent(clientKey, k -> new ConcurrentLinkedDeque<>()).addLast(now);
        cleanupOldAttempts(clientKey);
    }

    /**
     * Resets/clears the failure record on successful authentication.
     */
    public void resetAttempts(String clientKey) {
        if (clientKey != null) {
            attempts.remove(clientKey);
        }
    }

    private void cleanupOldAttempts(String clientKey) {
        ConcurrentLinkedDeque<Instant> clientAttempts = attempts.get(clientKey);
        if (clientAttempts == null) {
            return;
        }

        Instant cutoff = Instant.now().minusSeconds(windowSeconds);
        Iterator<Instant> iterator = clientAttempts.iterator();
        while (iterator.hasNext()) {
            Instant timestamp = iterator.next();
            if (timestamp.isBefore(cutoff)) {
                iterator.remove();
            } else {
                // Deque is in chronological order, subsequent timestamps are newer
                break;
            }
        }

        if (clientAttempts.isEmpty()) {
            attempts.remove(clientKey);
        }
    }

    /**
     * Resolves the client IP address from the HTTP request, inspecting standard proxy headers.
     */
    public static String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // X-Forwarded-For may contain comma-separated IPs: client, proxy1, proxy2
            return xForwardedFor.split(",")[0].trim();
        }

        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "unknown";
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getWindowSeconds() {
        return windowSeconds;
    }

    public void setWindowSeconds(int windowSeconds) {
        this.windowSeconds = windowSeconds;
    }
}
