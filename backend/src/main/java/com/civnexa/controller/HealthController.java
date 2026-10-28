package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.HealthResponse;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final Environment environment;

    public HealthController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse<String>> ping() {
        return ResponseEntity.ok(ApiResponse.ok("PONG", "CIVNEXA Backend Service Active"));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<HealthResponse>> health() {
        Runtime runtime = Runtime.getRuntime();
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("uptimeMs", uptimeMs);
        details.put("uptimeFormatted", formatUptime(uptimeMs));
        details.put("activeProfiles", Arrays.asList(environment.getActiveProfiles()));
        details.put("totalMemoryMb", runtime.totalMemory() / (1024 * 1024));
        details.put("freeMemoryMb", runtime.freeMemory() / (1024 * 1024));
        details.put("maxMemoryMb", runtime.maxMemory() / (1024 * 1024));
        details.put("availableProcessors", runtime.availableProcessors());

        HealthResponse healthResponse = HealthResponse.builder()
                .status("UP")
                .application("CIVNEXA Backend Service")
                .version("1.0.0")
                .environment(environment.getActiveProfiles().length > 0 ? environment.getActiveProfiles()[0] : "default")
                .timestamp(Instant.now())
                .details(details)
                .build();

        return ResponseEntity.ok(ApiResponse.ok(healthResponse, "System health verification passed"));
    }

    private String formatUptime(long ms) {
        long seconds = ms / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        return String.format("%02d:%02d:%02d", hours, minutes % 60, seconds % 60);
    }
}
