package com.civnexa.security.jwt;

import com.civnexa.entity.RevokedToken;
import com.civnexa.repository.RevokedTokenRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtTokenProvider tokenProvider;
    private final Map<String, Instant> inMemoryBlacklist = new ConcurrentHashMap<>();

    public TokenBlacklistService(RevokedTokenRepository revokedTokenRepository, JwtTokenProvider tokenProvider) {
        this.revokedTokenRepository = revokedTokenRepository;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public void revokeToken(String token) {
        if (token == null || token.isBlank()) return;

        try {
            Claims claims = tokenProvider.parseAndValidateClaims(token);
            String tokenId = claims.getId();
            String userRef = claims.getSubject();
            Date expiryDate = claims.getExpiration();
            Instant expiresAt = expiryDate != null ? expiryDate.toInstant() : Instant.now().plusSeconds(900);

            if (tokenId != null) {
                inMemoryBlacklist.put(tokenId, expiresAt);
                if (!revokedTokenRepository.existsByTokenId(tokenId)) {
                    revokedTokenRepository.save(new RevokedToken(tokenId, userRef, expiresAt));
                }
                log.info("JWT token jti={} for userRef={} has been revoked", tokenId, userRef);
            }
        } catch (Exception ex) {
            log.debug("Token revocation parsing note: {}", ex.getMessage());
            // Fallback: blacklist by token hash or substring if unparseable
            String fallbackId = "RAW-" + Math.abs(token.hashCode());
            inMemoryBlacklist.put(fallbackId, Instant.now().plusSeconds(900));
        }
    }

    @Transactional(readOnly = true)
    public boolean isRevoked(String token) {
        if (token == null || token.isBlank()) return false;

        try {
            Claims claims = tokenProvider.parseAndValidateClaims(token);
            String tokenId = claims.getId();
            if (tokenId == null) return false;

            Instant expiry = inMemoryBlacklist.get(tokenId);
            if (expiry != null) {
                if (Instant.now().isAfter(expiry)) {
                    inMemoryBlacklist.remove(tokenId);
                    return false;
                }
                return true;
            }

            // Check database
            if (revokedTokenRepository.existsByTokenId(tokenId)) {
                inMemoryBlacklist.put(tokenId, claims.getExpiration().toInstant());
                return true;
            }
        } catch (Exception ex) {
            String fallbackId = "RAW-" + Math.abs(token.hashCode());
            return inMemoryBlacklist.containsKey(fallbackId);
        }

        return false;
    }

    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void cleanupExpiredTokens() {
        Instant now = Instant.now();
        inMemoryBlacklist.entrySet().removeIf(entry -> now.isAfter(entry.getValue()));
        try {
            revokedTokenRepository.deleteExpiredTokens(now);
        } catch (Exception ex) {
            log.warn("Automatic expired token purge notice: {}", ex.getMessage());
        }
    }
}
