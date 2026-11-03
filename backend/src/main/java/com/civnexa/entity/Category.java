package com.civnexa.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "case_categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_key", nullable = false, unique = true, length = 50)
    private String categoryKey;

    @Column(nullable = false, length = 150)
    private String label;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "allows_anonymous", nullable = false)
    private boolean allowsAnonymous = false;

    @Column(columnDefinition = "TEXT")
    private String subcategories;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Category() {}

    public Category(String categoryKey, String label, String description, boolean allowsAnonymous, String subcategories) {
        this.categoryKey = categoryKey;
        this.label = label;
        this.description = description;
        this.allowsAnonymous = allowsAnonymous;
        this.subcategories = subcategories;
        this.active = true;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategoryKey() { return categoryKey; }
    public void setCategoryKey(String categoryKey) { this.categoryKey = categoryKey; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isAllowsAnonymous() { return allowsAnonymous; }
    public void setAllowsAnonymous(boolean allowsAnonymous) { this.allowsAnonymous = allowsAnonymous; }

    public String getSubcategories() { return subcategories; }
    public void setSubcategories(String subcategories) { this.subcategories = subcategories; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
