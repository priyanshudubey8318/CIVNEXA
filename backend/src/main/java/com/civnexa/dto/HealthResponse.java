package com.civnexa.dto;

import java.time.Instant;

public class HealthResponse {

    private String status;
    private String application;
    private String version;
    private Instant timestamp;

    public HealthResponse() {
    }

    public HealthResponse(String status, String application, String version, Instant timestamp) {
        this.status = status;
        this.application = application;
        this.version = version;
        this.timestamp = timestamp;
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

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public static class Builder {
        private String status;
        private String application;
        private String version;
        private Instant timestamp;

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

        public Builder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public HealthResponse build() {
            return new HealthResponse(status, application, version, timestamp);
        }
    }
}
