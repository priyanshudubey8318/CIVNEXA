package com.civnexa.repository;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.CounselingReferral;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.Priority;
import com.civnexa.entity.enums.ReferralStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CounselingReferralRepository extends JpaRepository<CounselingReferral, Long> {

    Optional<CounselingReferral> findByReferralNumber(String referralNumber);

    List<CounselingReferral> findByStudent(User student);

    List<CounselingReferral> findByCounselor(User counselor);

    List<CounselingReferral> findByReferredBy(User referredBy);

    List<CounselingReferral> findByCaseRecord(CaseRecord caseRecord);

    List<CounselingReferral> findByStatus(ReferralStatus status);

    List<CounselingReferral> findByPriority(Priority priority);

    Page<CounselingReferral> findByStatus(ReferralStatus status, Pageable pageable);

    boolean existsByReferralNumber(String referralNumber);

    long countByStatus(ReferralStatus status);
}
