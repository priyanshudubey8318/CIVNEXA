package com.civnexa.service;

import com.civnexa.dto.CategoryDTO;
import com.civnexa.entity.Category;
import com.civnexa.entity.User;
import com.civnexa.exception.ApiException;
import com.civnexa.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private static final Logger log = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    public CategoryService(CategoryRepository categoryRepository, AuditService auditService) {
        this.categoryRepository = categoryRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<CategoryDTO.Response> getAllCategories(boolean includeInactive) {
        List<Category> list = includeInactive ? categoryRepository.findAll() : categoryRepository.findByActiveTrue();
        return list.stream()
                .map(CategoryDTO.Response::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO.Response getCategoryById(Long id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("Category not found with ID: " + id, HttpStatus.NOT_FOUND));
        return CategoryDTO.Response.fromEntity(c);
    }

    @Transactional
    public CategoryDTO.Response createCategory(CategoryDTO.CreateRequest request, User actor) {
        String key = request.getResolvedKey();
        if (categoryRepository.existsByCategoryKeyIgnoreCase(key)) {
            throw new ApiException("Category with key '" + key + "' already exists", HttpStatus.CONFLICT);
        }

        Category category = new Category();
        category.setCategoryKey(key);
        category.setLabel(request.getLabel().trim());
        category.setDescription(request.getDescription());
        category.setAllowsAnonymous(Boolean.TRUE.equals(request.getAllowsAnonymous()));
        category.setSubcategories(request.getResolvedSubcategories());
        category.setActive(true);
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.saveAndFlush(category);

        if (auditService != null) {
            auditService.recordEvent("CATEGORY_CREATED", "CATEGORY", key, actor,
                    "Incident category '" + saved.getLabel() + "' registered");
        }

        log.info("Created incident category {} by actor {}", key, actor != null ? actor.getEmail() : "SYSTEM");
        return CategoryDTO.Response.fromEntity(saved);
    }

    @Transactional
    public CategoryDTO.Response updateCategory(Long id, CategoryDTO.UpdateRequest request, User actor) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("Category not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (request.getLabel() != null && !request.getLabel().isBlank()) {
            category.setLabel(request.getLabel().trim());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        if (request.getAllowsAnonymous() != null) {
            category.setAllowsAnonymous(request.getAllowsAnonymous());
        }
        if (request.getSubcategories() != null) {
            category.setSubcategories(request.getResolvedSubcategories());
        }
        if (request.getActive() != null) {
            category.setActive(request.getActive());
        }
        category.setUpdatedAt(Instant.now());

        Category saved = categoryRepository.saveAndFlush(category);

        if (auditService != null) {
            auditService.recordEvent("CATEGORY_UPDATED", "CATEGORY", category.getCategoryKey(), actor,
                    "Incident category '" + saved.getLabel() + "' updated");
        }

        return CategoryDTO.Response.fromEntity(saved);
    }

    @Transactional
    public void deleteCategory(Long id, User actor) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException("Category not found with ID: " + id, HttpStatus.NOT_FOUND));

        categoryRepository.delete(category);

        if (auditService != null) {
            auditService.recordEvent("CATEGORY_DELETED", "CATEGORY", category.getCategoryKey(), actor,
                    "Incident category '" + category.getLabel() + "' removed");
        }

        log.info("Deleted incident category {} by actor {}", category.getCategoryKey(), actor != null ? actor.getEmail() : "SYSTEM");
    }
}
