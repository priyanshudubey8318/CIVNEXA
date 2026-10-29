package com.civnexa.repository;

import com.civnexa.entity.EvidenceCustodyLog;
import com.civnexa.entity.EvidenceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceCustodyLogRepository extends JpaRepository<EvidenceCustodyLog, Long> {

    List<EvidenceCustodyLog> findByEvidenceItemOrderByTimestampAsc(EvidenceItem evidenceItem);

    List<EvidenceCustodyLog> findByEvidenceItemIdOrderByTimestampAsc(Long evidenceId);
}
