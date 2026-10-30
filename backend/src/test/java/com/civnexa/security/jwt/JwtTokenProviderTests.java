package com.civnexa.security.jwt;

import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTests {

    private static final String TEST_SECRET = "civnexa_test_super_secure_secret_key_at_least_256_bits_long_2026";
    private static final String OTHER_SECRET = "another_different_cryptographic_secret_key_at_least_256_bits_2026";
    private static final long EXPIRATION_MS = 900_000L; // 15 mins

    private JwtProperties jwtProperties;
    private JwtTokenProvider tokenProvider;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties(TEST_SECRET, EXPIRATION_MS, "CIVNEXA");
        tokenProvider = new JwtTokenProvider(jwtProperties);
        tokenProvider.init();

        testUser = new User();
        testUser.setUserReference("STU-2026-99999");
        testUser.setName("Priya Sharma");
        testUser.setEmail("priya.sharma@institution.edu");
        testUser.setRole(RoleType.STUDENT);
        testUser.setStatus("ACTIVE");
    }

    @Test
    @DisplayName("Successfully generates a well-formed JWT access token with expected claims")
    void testSuccessfulTokenGeneration() {
        String token = tokenProvider.generateToken(testUser);

        assertNotNull(token);
        assertFalse(token.isBlank());
        assertEquals(3, token.split("\\.").length); // header.payload.signature

        assertTrue(tokenProvider.validateToken(token));
        assertEquals("STU-2026-99999", tokenProvider.getUserReferenceFromToken(token));
        assertEquals(RoleType.STUDENT, tokenProvider.getRoleFromToken(token));

        Claims claims = tokenProvider.parseAndValidateClaims(token);
        assertEquals("STU-2026-99999", claims.getSubject());
        assertEquals("CIVNEXA", claims.getIssuer());
        assertNotNull(claims.getId());
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
        assertEquals("STU-2026-99999", claims.get("userRef", String.class));
        assertEquals("STUDENT", claims.get("role", String.class));
    }

    @Test
    @DisplayName("Valid token parsing retrieves subject, role, and expiration accurately")
    void testValidTokenParsing() {
        String token = tokenProvider.generateToken(testUser);

        Claims claims = tokenProvider.parseAndValidateClaims(token);
        assertEquals("STU-2026-99999", claims.getSubject());
        assertEquals("STUDENT", claims.get("role"));
        assertTrue(claims.getExpiration().after(new Date()));
    }

    @Test
    @DisplayName("Expired token is rejected by validateToken and throws ExpiredJwtException on parse")
    void testExpiredTokenRejection() {
        // Generate a token that expired 5 seconds ago
        String expiredToken = tokenProvider.generateTokenWithCustomExpiration(testUser, -5000L);

        assertFalse(tokenProvider.validateToken(expiredToken));
        assertThrows(ExpiredJwtException.class, () -> tokenProvider.parseAndValidateClaims(expiredToken));
    }

    @Test
    @DisplayName("Token signed with a different key is rejected with SignatureException")
    void testInvalidSignatureRejection() {
        JwtProperties otherProps = new JwtProperties(OTHER_SECRET, EXPIRATION_MS, "CIVNEXA");
        JwtTokenProvider otherProvider = new JwtTokenProvider(otherProps);
        otherProvider.init();

        String tokenFromOtherKey = otherProvider.generateToken(testUser);

        assertFalse(tokenProvider.validateToken(tokenFromOtherKey));
        assertThrows(SignatureException.class, () -> tokenProvider.parseAndValidateClaims(tokenFromOtherKey));
    }

    @Test
    @DisplayName("Malformed token string is rejected with MalformedJwtException")
    void testMalformedTokenRejection() {
        assertFalse(tokenProvider.validateToken("not.a.valid.jwt.token"));
        assertFalse(tokenProvider.validateToken("header.payload"));
        assertFalse(tokenProvider.validateToken(""));
        assertFalse(tokenProvider.validateToken(null));

        assertThrows(MalformedJwtException.class, () -> tokenProvider.parseAndValidateClaims("malformed.token.format"));
        assertThrows(MalformedJwtException.class, () -> tokenProvider.parseAndValidateClaims(""));
        assertThrows(MalformedJwtException.class, () -> tokenProvider.parseAndValidateClaims(null));
    }

    @Test
    @DisplayName("Token from an untrusted issuer is rejected")
    void testInvalidIssuerRejection() {
        JwtProperties rogueProps = new JwtProperties(TEST_SECRET, EXPIRATION_MS, "ROGUE_ISSUER");
        JwtTokenProvider rogueProvider = new JwtTokenProvider(rogueProps);
        rogueProvider.init();

        String tokenFromRogueIssuer = rogueProvider.generateToken(testUser);

        // Expected issuer is CIVNEXA; should fail validation
        assertFalse(tokenProvider.validateToken(tokenFromRogueIssuer));
        assertThrows(Exception.class, () -> tokenProvider.parseAndValidateClaims(tokenFromRogueIssuer));
    }

    @Test
    @DisplayName("Token missing required role claim is rejected")
    void testMissingRequiredClaimsRejection() {
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        String tokenWithoutRole = io.jsonwebtoken.Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject("STU-2026-99999")
                .issuer("CIVNEXA")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .signWith(key, io.jsonwebtoken.Jwts.SIG.HS256)
                .compact();

        assertFalse(tokenProvider.validateToken(tokenWithoutRole));
        assertThrows(MalformedJwtException.class, () -> tokenProvider.parseAndValidateClaims(tokenWithoutRole));
    }

    @Test
    @DisplayName("Secret key shorter than 256 bits throws IllegalStateException on startup validation")
    void testStartupValidationRejectsShortSecret() {
        String shortSecret = "too_short_secret"; // 16 bytes < 32 bytes

        JwtProperties invalidProps = new JwtProperties();
        invalidProps.setSecret(shortSecret);
        invalidProps.setExpirationMs(EXPIRATION_MS);

        IllegalStateException ex = assertThrows(IllegalStateException.class, invalidProps::validate);
        assertTrue(ex.getMessage().contains("at least 256 bits"));
    }

    @Test
    @DisplayName("Blank or null secret key throws IllegalStateException on startup validation")
    void testStartupValidationRejectsBlankSecret() {
        JwtProperties nullProps = new JwtProperties();
        nullProps.setSecret(null);
        assertThrows(IllegalStateException.class, nullProps::validate);

        JwtProperties blankProps = new JwtProperties();
        blankProps.setSecret("   ");
        assertThrows(IllegalStateException.class, blankProps::validate);
    }

    @Test
    @DisplayName("Unsigned token with alg:none is rejected")
    void testAlgorithmNoneTokenRejected() {
        String header = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payload = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"STU-2026-99999\",\"iss\":\"CIVNEXA\",\"jti\":\"12345\",\"role\":\"STUDENT\"}".getBytes(StandardCharsets.UTF_8));
        String unsignedToken = header + "." + payload + ".";

        assertFalse(tokenProvider.validateToken(unsignedToken));
        assertThrows(UnsupportedJwtException.class, () -> tokenProvider.parseAndValidateClaims(unsignedToken));

        String unsignedNoTrailingDot = header + "." + payload;
        assertFalse(tokenProvider.validateToken(unsignedNoTrailingDot));
        assertThrows(MalformedJwtException.class, () -> tokenProvider.parseAndValidateClaims(unsignedNoTrailingDot));
    }

    @Test
    @DisplayName("Token with unsupported algorithm (HS512 instead of HS256) is rejected")
    void testUnsupportedAlgorithmRejected() {
        String secret512 = "a_very_long_cryptographic_secret_key_at_least_512_bits_long_for_hs512_testing_purposes_1234567890_abcdefghij";
        SecretKey key512 = Keys.hmacShaKeyFor(secret512.getBytes(StandardCharsets.UTF_8));

        String hs512Token = io.jsonwebtoken.Jwts.builder()
                .header()
                    .type("JWT")
                    .and()
                .id(UUID.randomUUID().toString())
                .subject("STU-2026-99999")
                .issuer("CIVNEXA")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60000))
                .claim("role", "STUDENT")
                .claim("userRef", "STU-2026-99999")
                .signWith(key512, io.jsonwebtoken.Jwts.SIG.HS512)
                .compact();

        assertFalse(tokenProvider.validateToken(hs512Token));
        assertThrows(Exception.class, () -> tokenProvider.parseAndValidateClaims(hs512Token));
    }
}
