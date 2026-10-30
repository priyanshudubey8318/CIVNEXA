package com.civnexa.security.jwt;

import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.UserRepository;
import com.civnexa.security.CivnexaUserPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JwtAuthenticationFilterTests {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    private User activeUser;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        activeUser = new User();
        activeUser.setId(100L);
        activeUser.setUserReference("STU-2026-12345");
        activeUser.setName("Active Student");
        activeUser.setEmail("active.student@institution.edu");
        activeUser.setPasswordHash("$2a$10$dummyHashValueForTestingPurposes1234567890");
        activeUser.setRole(RoleType.STUDENT);
        activeUser.setStatus("ACTIVE");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Request without Authorization header passes through without setting authentication")
    void testRequestWithoutAuthorizationHeader() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(tokenProvider);
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Request with non-Bearer Authorization header passes through without setting authentication")
    void testRequestWithNonBearerHeader() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNzd29yZA==");

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(tokenProvider);
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Request with invalid JWT passes through and does not authenticate")
    void testRequestWithInvalidJwt() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid.token.payload");
        when(tokenProvider.validateToken("invalid.token.payload")).thenReturn(false);

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Valid JWT with ACTIVE user successfully authenticates and sets SecurityContext")
    void testValidJwtWithActiveUserAuthenticates() throws ServletException, IOException {
        String validToken = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserReferenceFromToken(validToken)).thenReturn("STU-2026-12345");
        when(userRepository.findByUserReference("STU-2026-12345")).thenReturn(Optional.of(activeUser));

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertTrue(auth.isAuthenticated());
        assertInstanceOf(CivnexaUserPrincipal.class, auth.getPrincipal());
        CivnexaUserPrincipal principal = (CivnexaUserPrincipal) auth.getPrincipal();
        assertEquals("STU-2026-12345", principal.getUserReference());
        assertEquals(RoleType.STUDENT, principal.getRole());
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT")));
    }

    @Test
    @DisplayName("Authoritative DB check: PENDING_VERIFICATION user cannot authenticate with valid JWT")
    void testValidJwtWithPendingVerificationUserRejected() throws ServletException, IOException {
        User pendingUser = new User();
        pendingUser.setUserReference("STU-2026-54321");
        pendingUser.setRole(RoleType.STUDENT);
        pendingUser.setStatus("PENDING_VERIFICATION");

        String validToken = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserReferenceFromToken(validToken)).thenReturn("STU-2026-54321");
        when(userRepository.findByUserReference("STU-2026-54321")).thenReturn(Optional.of(pendingUser));

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Authoritative DB check: SUSPENDED user cannot authenticate with valid JWT")
    void testValidJwtWithSuspendedUserRejected() throws ServletException, IOException {
        User suspendedUser = new User();
        suspendedUser.setUserReference("STU-2026-66666");
        suspendedUser.setRole(RoleType.STUDENT);
        suspendedUser.setStatus("SUSPENDED");

        String validToken = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserReferenceFromToken(validToken)).thenReturn("STU-2026-66666");
        when(userRepository.findByUserReference("STU-2026-66666")).thenReturn(Optional.of(suspendedUser));

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Authoritative DB check: INACTIVE user cannot authenticate with valid JWT")
    void testValidJwtWithInactiveUserRejected() throws ServletException, IOException {
        User inactiveUser = new User();
        inactiveUser.setUserReference("FAC-2026-77777");
        inactiveUser.setRole(RoleType.FACULTY);
        inactiveUser.setStatus("INACTIVE");

        String validToken = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserReferenceFromToken(validToken)).thenReturn("FAC-2026-77777");
        when(userRepository.findByUserReference("FAC-2026-77777")).thenReturn(Optional.of(inactiveUser));

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Authoritative DB check: Non-existent user in DB cannot authenticate with valid JWT")
    void testValidJwtWithNonExistentUserRejected() throws ServletException, IOException {
        String validToken = "valid.jwt.token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + validToken);
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserReferenceFromToken(validToken)).thenReturn("STU-2026-00000");
        when(userRepository.findByUserReference("STU-2026-00000")).thenReturn(Optional.empty());

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    @DisplayName("Authoritative DB role: When DB role changes to FACULTY, original token grants ROLE_FACULTY (JWT claim ignored)")
    void testAuthoritativeDbRoleOverridesJwtRoleClaim() throws ServletException, IOException {
        // User originally had STUDENT in JWT, but DB record has updated to FACULTY
        User userInDb = new User();
        userInDb.setId(101L);
        userInDb.setUserReference("STU-2026-12345");
        userInDb.setName("Promoted Faculty");
        userInDb.setEmail("promoted.faculty@institution.edu");
        userInDb.setRole(RoleType.FACULTY); // Changed in database
        userInDb.setStatus("ACTIVE");

        String tokenWithStudentClaim = "token.with.original.student.claim";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + tokenWithStudentClaim);
        when(tokenProvider.validateToken(tokenWithStudentClaim)).thenReturn(true);
        when(tokenProvider.getUserReferenceFromToken(tokenWithStudentClaim)).thenReturn("STU-2026-12345");
        when(userRepository.findByUserReference("STU-2026-12345")).thenReturn(Optional.of(userInDb));

        filter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertTrue(auth.isAuthenticated());

        // Assert DB authority (ROLE_FACULTY) is granted, NOT the stale JWT role claim (ROLE_STUDENT)
        assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY")));
        assertFalse(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT")));

        CivnexaUserPrincipal principal = (CivnexaUserPrincipal) auth.getPrincipal();
        assertEquals(RoleType.FACULTY, principal.getRole());
    }
}
