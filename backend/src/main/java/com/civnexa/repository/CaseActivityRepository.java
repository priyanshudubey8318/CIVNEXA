package com.civnexa.repository;

import com.civnexa.entity.CaseActivity;
import com.civnexa.entity.CaseRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseActivityRepository extends JpaRepository<CaseActivity, Long> {

    List<CaseActivity> findByCaseRecordOrderByTimestampDesc(CaseRecord caseRecord);

    List<CaseActivity> findByCaseRecordIdOrderByTimestampDesc(Long caseId);

    Page<CaseActivity> findByCaseRecord(CaseRecord caseRecord, Pageable pageable);
}
