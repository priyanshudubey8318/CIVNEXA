package com.civnexa.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class HealthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/ping returns lightweight PONG heartbeat")
    void testPingEndpoint() throws Exception {
        mockMvc.perform(get("/ping")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is("PONG")))
                .andExpect(jsonPath("$.message", is("CIVNEXA Backend Service Active")));
    }

    @Test
    @DisplayName("GET /api/v1/health returns minimal system UP status")
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("UP")))
                .andExpect(jsonPath("$.data.application", is("CIVNEXA Backend Service")))
                .andExpect(jsonPath("$.data.version", is("1.0.0")))
                .andExpect(jsonPath("$.data.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/health does not leak internal diagnostics or JVM memory")
    void testHealthEndpointDoesNotLeakDiagnostics() throws Exception {
        mockMvc.perform(get("/health")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.details").doesNotExist())
                .andExpect(jsonPath("$.data.totalMemoryMb").doesNotExist())
                .andExpect(jsonPath("$.data.freeMemoryMb").doesNotExist())
                .andExpect(jsonPath("$.data.maxMemoryMb").doesNotExist())
                .andExpect(jsonPath("$.data.availableProcessors").doesNotExist())
                .andExpect(jsonPath("$.data.activeProfiles").doesNotExist())
                .andExpect(jsonPath("$.data.uptimeMs").doesNotExist())
                .andExpect(jsonPath("$.data.database").doesNotExist())
                .andExpect(jsonPath("$.data.environment").doesNotExist());
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoint is denied")
    void testUnauthenticatedAccessDenied() throws Exception {
        mockMvc.perform(get("/cases")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
