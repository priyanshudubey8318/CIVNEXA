package com.civnexa.dto;

import com.civnexa.entity.Category;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class CategoryDTO {

    public static class Response {
        private Long id;
        private String key;
        private String categoryKey;
        private String label;
        private String description;
        private boolean allowsAnonymous;
        private List<String> subcategories;
        private boolean active;
        private Instant createdAt;

        public static Response fromEntity(Category c) {
            Response r = new Response();
            r.setId(c.getId());
            r.setKey(c.getCategoryKey());
            r.setCategoryKey(c.getCategoryKey());
            r.setLabel(c.getLabel());
            r.setDescription(c.getDescription());
            r.setAllowsAnonymous(c.isAllowsAnonymous());
            if (c.getSubcategories() != null && !c.getSubcategories().isBlank()) {
                r.setSubcategories(Arrays.stream(c.getSubcategories().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList()));
            } else {
                r.setSubcategories(Collections.emptyList());
            }
            r.setActive(c.isActive());
            r.setCreatedAt(c.getCreatedAt());
            return r;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getCategoryKey() { return categoryKey; }
        public void setCategoryKey(String categoryKey) { this.categoryKey = categoryKey; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public boolean isAllowsAnonymous() { return allowsAnonymous; }
        public void setAllowsAnonymous(boolean allowsAnonymous) { this.allowsAnonymous = allowsAnonymous; }
        public List<String> getSubcategories() { return subcategories; }
        public void setSubcategories(List<String> subcategories) { this.subcategories = subcategories; }
        public boolean isActive() { return active; }
        public void setActive(boolean active) { this.active = active; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    }

    public static class CreateRequest {
        private String key;
        private String categoryKey;

        @NotBlank(message = "Category label is required")
        private String label;

        private String description;
        private Boolean allowsAnonymous;
        private Object subcategories;

        public String getResolvedKey() {
            if (categoryKey != null && !categoryKey.isBlank()) return categoryKey.trim().toUpperCase();
            if (key != null && !key.isBlank()) return key.trim().toUpperCase();
            if (label != null) return label.trim().toUpperCase().replaceAll("[^A-Z0-9]+", "_");
            return "CATEGORY_" + System.currentTimeMillis();
        }

        public String getResolvedSubcategories() {
            if (subcategories == null) return "";
            if (subcategories instanceof List<?> list) {
                return list.stream().map(Object::toString).map(String::trim).collect(Collectors.joining(", "));
            }
            return subcategories.toString().trim();
        }

        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getCategoryKey() { return categoryKey; }
        public void setCategoryKey(String categoryKey) { this.categoryKey = categoryKey; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getAllowsAnonymous() { return allowsAnonymous; }
        public void setAllowsAnonymous(Boolean allowsAnonymous) { this.allowsAnonymous = allowsAnonymous; }
        public Object getSubcategories() { return subcategories; }
        public void setSubcategories(Object subcategories) { this.subcategories = subcategories; }
    }

    public static class UpdateRequest {
        private String label;
        private String description;
        private Boolean allowsAnonymous;
        private Object subcategories;
        private Boolean active;

        public String getResolvedSubcategories() {
            if (subcategories == null) return null;
            if (subcategories instanceof List<?> list) {
                return list.stream().map(Object::toString).map(String::trim).collect(Collectors.joining(", "));
            }
            return subcategories.toString().trim();
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getAllowsAnonymous() { return allowsAnonymous; }
        public void setAllowsAnonymous(Boolean allowsAnonymous) { this.allowsAnonymous = allowsAnonymous; }
        public Object getSubcategories() { return subcategories; }
        public void setSubcategories(Object subcategories) { this.subcategories = subcategories; }
        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }
    }
}
