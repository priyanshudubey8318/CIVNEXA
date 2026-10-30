package com.civnexa.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class RoleAuthorizationTests {

    @TestConfiguration
    static class RoleTestConfig {
        @Bean
        public SecuredTestService securedTestService() {
            return new SecuredTestService();
        }
    }

    public static class SecuredTestService {

        @PreAuthorize("hasRole('SUPER_ADMIN')")
        public String accessSuperAdmin() {
            return "SUPER_ADMIN_GRANTED";
        }

        @PreAuthorize("hasRole('DEAN')")
        public String accessDean() {
            return "DEAN_GRANTED";
        }

        @PreAuthorize("hasRole('HOD')")
        public String accessHod() {
            return "HOD_GRANTED";
        }

        @PreAuthorize("hasRole('FACULTY')")
        public String accessFaculty() {
            return "FACULTY_GRANTED";
        }

        @PreAuthorize("hasRole('STAFF')")
        public String accessStaff() {
            return "STAFF_GRANTED";
        }

        @PreAuthorize("hasRole('COORDINATOR')")
        public String accessCoordinator() {
            return "COORDINATOR_GRANTED";
        }

        @PreAuthorize("hasRole('COMMITTEE_MEMBER')")
        public String accessCommitteeMember() {
            return "COMMITTEE_MEMBER_GRANTED";
        }

        @PreAuthorize("hasRole('STUDENT')")
        public String accessStudent() {
            return "STUDENT_GRANTED";
        }

        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN', 'HOD')")
        public String accessAcademicLeadership() {
            return "LEADERSHIP_GRANTED";
        }
    }

    @Autowired
    private SecuredTestService securedTestService;

    // --- 1. SUPER_ADMIN ---
    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    @DisplayName("ROLE_SUPER_ADMIN can access SUPER_ADMIN secured methods")
    void testSuperAdminAccess() {
        assertEquals("SUPER_ADMIN_GRANTED", securedTestService.accessSuperAdmin());
        assertEquals("LEADERSHIP_GRANTED", securedTestService.accessAcademicLeadership());
    }

    // --- 2. DEAN ---
    @Test
    @WithMockUser(roles = "DEAN")
    @DisplayName("ROLE_DEAN can access DEAN and Leadership secured methods")
    void testDeanAccess() {
        assertEquals("DEAN_GRANTED", securedTestService.accessDean());
        assertEquals("LEADERSHIP_GRANTED", securedTestService.accessAcademicLeadership());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessSuperAdmin());
    }

    // --- 3. HOD ---
    @Test
    @WithMockUser(roles = "HOD")
    @DisplayName("ROLE_HOD can access HOD and Leadership secured methods")
    void testHodAccess() {
        assertEquals("HOD_GRANTED", securedTestService.accessHod());
        assertEquals("LEADERSHIP_GRANTED", securedTestService.accessAcademicLeadership());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessDean());
    }

    // --- 4. FACULTY ---
    @Test
    @WithMockUser(roles = "FACULTY")
    @DisplayName("ROLE_FACULTY can access FACULTY secured methods but is denied Leadership")
    void testFacultyAccess() {
        assertEquals("FACULTY_GRANTED", securedTestService.accessFaculty());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessAcademicLeadership());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessHod());
    }

    // --- 5. STAFF ---
    @Test
    @WithMockUser(roles = "STAFF")
    @DisplayName("ROLE_STAFF can access STAFF secured methods")
    void testStaffAccess() {
        assertEquals("STAFF_GRANTED", securedTestService.accessStaff());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessFaculty());
    }

    // --- 6. COORDINATOR ---
    @Test
    @WithMockUser(roles = "COORDINATOR")
    @DisplayName("ROLE_COORDINATOR can access COORDINATOR secured methods")
    void testCoordinatorAccess() {
        assertEquals("COORDINATOR_GRANTED", securedTestService.accessCoordinator());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessDean());
    }

    // --- 7. COMMITTEE_MEMBER ---
    @Test
    @WithMockUser(roles = "COMMITTEE_MEMBER")
    @DisplayName("ROLE_COMMITTEE_MEMBER can access COMMITTEE_MEMBER secured methods")
    void testCommitteeMemberAccess() {
        assertEquals("COMMITTEE_MEMBER_GRANTED", securedTestService.accessCommitteeMember());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessSuperAdmin());
    }

    // --- 8. STUDENT ---
    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("ROLE_STUDENT can access STUDENT secured methods and is denied all staff/leadership methods")
    void testStudentAccess() {
        assertEquals("STUDENT_GRANTED", securedTestService.accessStudent());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessSuperAdmin());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessDean());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessHod());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessFaculty());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessStaff());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessCoordinator());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessCommitteeMember());
        assertThrows(AccessDeniedException.class, () -> securedTestService.accessAcademicLeadership());
    }

    // --- Unauthenticated ---
    @Test
    @DisplayName("Unauthenticated invocation of secured method throws AuthenticationCredentialsNotFoundException or AccessDeniedException")
    void testUnauthenticatedCallFails() {
        assertThrows(Exception.class, () -> securedTestService.accessStudent());
    }
}
