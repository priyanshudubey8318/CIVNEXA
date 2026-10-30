package com.civnexa.security.jwt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;

import static org.junit.jupiter.api.Assertions.*;

public class JwtSecurityHandlersTests {

    private final JwtAuthenticationEntryPoint entryPoint = new JwtAuthenticationEntryPoint();
    private final JwtAccessDeniedHandler accessDeniedHandler = new JwtAccessDeniedHandler();

    @Test
    @DisplayName("JwtAuthenticationEntryPoint returns HTTP 401 with standard JSON error payload")
    void testAuthenticationEntryPointReturns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/cases");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response, new BadCredentialsException("No token provided"));

        assertEquals(401, response.getStatus());
        assertEquals("application/json;charset=UTF-8", response.getContentType());

        String content = response.getContentAsString();
        assertTrue(content.contains("\"success\":false"));
        assertTrue(content.contains("Unauthorized"));
        assertTrue(content.contains("\"timestamp\""));
    }

    @Test
    @DisplayName("JwtAccessDeniedHandler returns HTTP 403 with standard JSON error payload")
    void testAccessDeniedHandlerReturns403() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        accessDeniedHandler.handle(request, response, new AccessDeniedException("Insufficient role privileges"));

        assertEquals(403, response.getStatus());
        assertEquals("application/json;charset=UTF-8", response.getContentType());

        String content = response.getContentAsString();
        assertTrue(content.contains("\"success\":false"));
        assertTrue(content.contains("Access denied"));
        assertTrue(content.contains("\"timestamp\""));
    }
}
