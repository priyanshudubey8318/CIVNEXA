package com.civnexa.repository;

import com.civnexa.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCategoryKeyIgnoreCase(String categoryKey);
    List<Category> findByActiveTrue();
    boolean existsByCategoryKeyIgnoreCase(String categoryKey);
}
