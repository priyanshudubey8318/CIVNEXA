package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.HealthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
public class HealthController {

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<String>> ping() {
        return ResponseEntity.ok(ApiResponse.ok("PONG", "CIVNEXA Backend Service Active"));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<HealthResponse>> health() {
        HealthResponse healthResponse = HealthResponse.builder()
                .status("UP")
                .application("CIVNEXA Backend Service")
                .version("1.0.0")
                .timestamp(Instant.now())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(healthResponse, "CIVNEXA Backend Service Operational"));
    }
}
