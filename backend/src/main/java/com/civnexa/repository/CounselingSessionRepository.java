package com.civnexa.repository;

import com.civnexa.entity.CounselingReferral;
import com.civnexa.entity.CounselingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CounselingSessionRepository extends JpaRepository<CounselingSession, Long> {

    List<CounselingSession> findByReferralOrderBySessionNumberAsc(CounselingReferral referral);

    List<CounselingSession> findByReferralIdOrderBySessionNumberAsc(Long referralId);
}
