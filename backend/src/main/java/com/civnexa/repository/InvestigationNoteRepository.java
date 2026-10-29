package com.civnexa.repository;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.InvestigationNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestigationNoteRepository extends JpaRepository<InvestigationNote, Long> {

    List<InvestigationNote> findByCaseRecordOrderByCreatedAtAsc(CaseRecord caseRecord);

    List<InvestigationNote> findByCaseRecordAndIsConfidentialFalseOrderByCreatedAtAsc(CaseRecord caseRecord);
}
