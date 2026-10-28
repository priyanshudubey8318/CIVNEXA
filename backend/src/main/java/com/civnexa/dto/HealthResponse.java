package com.civnexa.dto;

import java.time.Instant;
import java.util.Map;

public class HealthResponse {

    private String status;
    private String application;
    private String version;
    private String environment;
    private Instant timestamp;
    private Map<String, Object> details;

    public HealthResponse() {
    }

    public HealthResponse(String status, String application, String version, String environment, Instant timestamp, Map<String, Object> details) {
        this.status = status;
        this.application = application;
        this.version = version;
        this.environment = environment;
        this.timestamp = timestamp;
        this.details = details;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getApplication() {
        return application;
    }

    public void setApplication(String application) {
        this.application = application;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }

    public static class Builder {
        private String status;
        private String application;
        private String version;
        private String environment;
        private Instant timestamp;
        private Map<String, Object> details;

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder application(String application) {
            this.application = application;
            return this;
        }

        public Builder version(String version) {
            this.version = version;
            return this;
        }

        public Builder environment(String environment) {
            this.environment = environment;
            return this;
        }

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder details(Map<String, Object> details) {
            this.details = details;
            return this;
        }

        public HealthResponse build() {
            return new HealthResponse(status, application, version, environment, timestamp, details);
        }
    }
}
