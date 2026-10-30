package com.civnexa.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

@Entity
@Table(name = "email_verifications", indexes = {
    @Index(name = "idx_email_verif_email", columnList = "email"),
    @Index(name = "idx_email_verif_created", columnList = "created_at")
})
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Email
    @Size(max = 120)
    @Column(name = "email", nullable = false, length = 120)
    private String email;

    @NotBlank
    @Size(max = 255)
    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    @NotNull
    @Column(name = "attempts", nullable = false)
    private int attempts = 0;

    @NotNull
    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 5;

    @NotNull
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @NotNull
    @Column(name = "resend_available_at", nullable = false)
    private Instant resendAvailableAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public EmailVerification() {
    }

    public EmailVerification(String email, String otpHash, Instant expiresAt, Instant resendAvailableAt) {
        this.email = email;
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
        this.resendAvailableAt = resendAvailableAt;
        this.attempts = 0;
        this.maxAttempts = 5;
        this.createdAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public void setOtpHash(String otpHash) {
        this.otpHash = otpHash;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getResendAvailableAt() {
        return resendAvailableAt;
    }

    public void setResendAvailableAt(Instant resendAvailableAt) {
        this.resendAvailableAt = resendAvailableAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(Instant verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
