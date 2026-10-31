package com.civnexa.repository;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.EvidenceItem;
import com.civnexa.entity.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceItemRepository extends JpaRepository<EvidenceItem, Long> {

    Optional<EvidenceItem> findByEvidenceReference(String evidenceReference);

    Optional<EvidenceItem> findByQrCustodyToken(String qrCustodyToken);

    List<EvidenceItem> findByCaseRecord(CaseRecord caseRecord);

    List<EvidenceItem> findByCaseRecordId(Long caseId);

    List<EvidenceItem> findByReviewStatus(ReviewStatus reviewStatus);

    Page<EvidenceItem> findByCaseRecord(CaseRecord caseRecord, Pageable pageable);

    boolean existsByEvidenceReference(String evidenceReference);
}
