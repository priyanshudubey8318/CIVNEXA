package com.civnexa.security;

import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

/**
 * Custom UserDetails implementation representing the authenticated institutional principal.
 * Adapts {@link User} entity for Spring Security context.
 */
public class CivnexaUserPrincipal implements UserDetails {

    private final Long id;
    private final String userReference;
    private final String email;
    private final String passwordHash;
    private final RoleType role;
    private final String status;
    private final User user;
    private final Collection<? extends GrantedAuthority> authorities;

    public CivnexaUserPrincipal(Long id,
                                String userReference,
                                String email,
                                String passwordHash,
                                RoleType role,
                                String status,
                                User user,
                                Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.userReference = userReference;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.status = status;
        this.user = user;
        this.authorities = authorities;
    }

    public static CivnexaUserPrincipal create(User user) {
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        return new CivnexaUserPrincipal(
                user.getId(),
                user.getUserReference(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole(),
                user.getStatus(),
                user,
                authorities
        );
    }

    public Long getId() {
        return id;
    }

    public String getUserReference() {
        return userReference;
    }

    public String getEmail() {
        return email;
    }

    public RoleType getRole() {
        return role;
    }

    public String getStatus() {
        return status;
    }

    public User getUser() {
        return user;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return userReference;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"SUSPENDED".equalsIgnoreCase(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equalsIgnoreCase(status);
    }
}
