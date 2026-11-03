package com.civnexa.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "revoked_tokens")
public class RevokedToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token_id", nullable = false, unique = true, length = 100)
    private String tokenId;

    @Column(name = "user_reference", nullable = false, length = 50)
    private String userReference;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at", nullable = false, updatable = false)
    private Instant revokedAt = Instant.now();

    public RevokedToken() {}

    public RevokedToken(String tokenId, String userReference, Instant expiresAt) {
        this.tokenId = tokenId;
        this.userReference = userReference;
        this.expiresAt = expiresAt;
        this.revokedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTokenId() { return tokenId; }
    public void setTokenId(String tokenId) { this.tokenId = tokenId; }

    public String getUserReference() { return userReference; }
    public void setUserReference(String userReference) { this.userReference = userReference; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
}
