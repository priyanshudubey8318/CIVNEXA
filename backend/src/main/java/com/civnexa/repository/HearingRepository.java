package com.civnexa.repository;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.Hearing;
import com.civnexa.entity.enums.HearingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HearingRepository extends JpaRepository<Hearing, Long> {

    Optional<Hearing> findByHearingNumber(String hearingNumber);

    List<Hearing> findByCaseRecord(CaseRecord caseRecord);

    List<Hearing> findByHearingDate(LocalDate hearingDate);

    List<Hearing> findByHearingDateAndVenue(LocalDate hearingDate, String venue);

    List<Hearing> findByStatus(HearingStatus status);

    Page<Hearing> findByStatus(HearingStatus status, Pageable pageable);

    boolean existsByHearingNumber(String hearingNumber);
}
