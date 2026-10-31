package com.civnexa.repository;

import com.civnexa.entity.AiKnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiKnowledgeDocumentRepository extends JpaRepository<AiKnowledgeDocument, Long> {

    List<AiKnowledgeDocument> findByIsActiveTrue();

    List<AiKnowledgeDocument> findByCategoryAndIsActiveTrue(String category);

    Optional<AiKnowledgeDocument> findByDocumentCode(String documentCode);

    boolean existsByDocumentCode(String documentCode);
}
