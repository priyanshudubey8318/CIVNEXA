package com.civnexa.controller;

import com.civnexa.dto.ApiResponse;
import com.civnexa.dto.CategoryDTO;
import com.civnexa.entity.User;
import com.civnexa.security.CivnexaUserPrincipal;
import com.civnexa.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/categories", "/api/v1/categories"})
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryDTO.Response>>> getCategories(
            @RequestParam(value = "includeInactive", defaultValue = "false") boolean includeInactive) {
        List<CategoryDTO.Response> categories = categoryService.getAllCategories(includeInactive);
        return ResponseEntity.ok(ApiResponse.ok(categories, "Categories retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryDTO.Response>> getCategoryById(@PathVariable Long id) {
        CategoryDTO.Response category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(category, "Category retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<CategoryDTO.Response>> createCategory(
            @Valid @RequestBody CategoryDTO.CreateRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        CategoryDTO.Response response = categoryService.createCategory(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response, "Category '" + response.getLabel() + "' configured successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'DEAN')")
    public ResponseEntity<ApiResponse<CategoryDTO.Response>> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryDTO.UpdateRequest request,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        CategoryDTO.Response response = categoryService.updateCategory(id, request, actor);
        return ResponseEntity.ok(ApiResponse.ok(response, "Category updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal CivnexaUserPrincipal principal) {
        User actor = principal != null ? principal.getUser() : null;
        categoryService.deleteCategory(id, actor);
        return ResponseEntity.ok(ApiResponse.ok(null, "Category deleted successfully"));
    }
}
