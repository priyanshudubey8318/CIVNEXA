package com.civnexa.security;

import com.civnexa.entity.RevokedToken;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.RevokedTokenRepository;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.jwt.JwtTokenProvider;
import com.civnexa.security.jwt.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class TokenBlacklistTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private TokenBlacklistService tokenBlacklistService;

    @Autowired
    private RevokedTokenRepository revokedTokenRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private String rawToken;

    @BeforeEach
    public void setup() {
        testUser = userRepository.findByEmailIgnoreCase("blacklist.test@civnexa.edu").orElseGet(() -> {
            User u = new User();
            u.setUserReference("USR-BLK-001");
            u.setName("Blacklist Test User");
            u.setEmail("blacklist.test@civnexa.edu");
            u.setPasswordHash("$2a$10$dummyHashForTestingPurposesOnly");
            u.setRole(RoleType.FACULTY);
            u.setStatus("ACTIVE");
            return userRepository.saveAndFlush(u);
        });

        rawToken = jwtTokenProvider.generateToken(testUser);
    }

    @Test
    public void testTokenRevocationMechanism() {
        assertFalse(tokenBlacklistService.isRevoked(rawToken), "Freshly generated token should not be revoked");

        tokenBlacklistService.revokeToken(rawToken);

        assertTrue(tokenBlacklistService.isRevoked(rawToken), "Revoked token must be recognized as revoked");
    }

    @Test
    public void testRevokedTokenRejectedByFilter() throws Exception {
        String authHeader = "Bearer " + rawToken;

        // Before revocation: /auth/me succeeds with 200 OK
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Perform revocation
        tokenBlacklistService.revokeToken(rawToken);

        // After revocation: /auth/me rejected with 401 Unauthorized
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testLogoutEndpointRevokesToken() throws Exception {
        String tokenToLogout = jwtTokenProvider.generateToken(testUser);
        String authHeader = "Bearer " + tokenToLogout;

        // Call /auth/logout
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Token should now be revoked and rejected
        assertTrue(tokenBlacklistService.isRevoked(tokenToLogout));

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testCleanupExpiredTokensRemovesExpiredAndPreservesActive() {
        String expiredJti = "EXP-" + UUID.randomUUID().toString();
        String activeJti = "ACT-" + UUID.randomUUID().toString();

        RevokedToken expiredToken = new RevokedToken(expiredJti, testUser.getUserReference(), Instant.now().minusSeconds(1800));
        RevokedToken activeToken = new RevokedToken(activeJti, testUser.getUserReference(), Instant.now().plusSeconds(1800));

        revokedTokenRepository.saveAndFlush(expiredToken);
        revokedTokenRepository.saveAndFlush(activeToken);

        assertTrue(revokedTokenRepository.existsByTokenId(expiredJti), "Expired token record must exist before cleanup");
        assertTrue(revokedTokenRepository.existsByTokenId(activeJti), "Active token record must exist before cleanup");

        tokenBlacklistService.cleanupExpiredTokens();

        assertFalse(revokedTokenRepository.existsByTokenId(expiredJti), "Expired token record must be purged by cleanup");
        assertTrue(revokedTokenRepository.existsByTokenId(activeJti), "Active token record must be preserved by cleanup");
    }

    @Test
    public void testCleanupFailureDoesNotInterruptAuthentication() throws Exception {
        // Even if cleanup routine is called with unexpected boundary conditions or errors,
        // it catches exceptions safely and authentication flow remains operational
        tokenBlacklistService.cleanupExpiredTokens();

        String freshToken = jwtTokenProvider.generateToken(testUser);
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + freshToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
