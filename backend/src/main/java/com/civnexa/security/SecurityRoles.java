package com.civnexa.security;

/**
 * Standard Spring Security role constants for CIVNEXA.
 * Corresponds to {@link com.civnexa.entity.enums.RoleType} with the standard "ROLE_" authority prefix.
 */
public final class SecurityRoles {

    private SecurityRoles() {
        // Prevent instantiation
    }

    public static final String PREFIX = "ROLE_";

    // Prefixed authority strings for hasAuthority() or filter matches
    public static final String ROLE_SUPER_ADMIN = "ROLE_SUPER_ADMIN";
    public static final String ROLE_DEAN = "ROLE_DEAN";
    public static final String ROLE_HOD = "ROLE_HOD";
    public static final String ROLE_FACULTY = "ROLE_FACULTY";
    public static final String ROLE_STAFF = "ROLE_STAFF";
    public static final String ROLE_COORDINATOR = "ROLE_COORDINATOR";
    public static final String ROLE_COMMITTEE_MEMBER = "ROLE_COMMITTEE_MEMBER";
    public static final String ROLE_STUDENT = "ROLE_STUDENT";

    // Non-prefixed role strings for Spring Security @PreAuthorize("hasRole(...)") expressions
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String DEAN = "DEAN";
    public static final String HOD = "HOD";
    public static final String FACULTY = "FACULTY";
    public static final String STAFF = "STAFF";
    public static final String COORDINATOR = "COORDINATOR";
    public static final String COMMITTEE_MEMBER = "COMMITTEE_MEMBER";
    public static final String STUDENT = "STUDENT";
}
