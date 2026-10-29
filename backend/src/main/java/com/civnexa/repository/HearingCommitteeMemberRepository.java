package com.civnexa.repository;

import com.civnexa.entity.Hearing;
import com.civnexa.entity.HearingCommitteeMember;
import com.civnexa.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HearingCommitteeMemberRepository extends JpaRepository<HearingCommitteeMember, Long> {

    List<HearingCommitteeMember> findByHearing(Hearing hearing);

    List<HearingCommitteeMember> findByMember(User member);

    Optional<HearingCommitteeMember> findByHearingAndMember(Hearing hearing, User member);

    boolean existsByHearingAndMember(Hearing hearing, User member);

    void deleteByHearingAndMember(Hearing hearing, User member);
}
