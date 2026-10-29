package com.civnexa.repository;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.StudentResponse;
import com.civnexa.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentResponseRepository extends JpaRepository<StudentResponse, Long> {

    List<StudentResponse> findByCaseRecordOrderBySubmittedAtAsc(CaseRecord caseRecord);

    List<StudentResponse> findByStudentOrderBySubmittedAtDesc(User student);
}
