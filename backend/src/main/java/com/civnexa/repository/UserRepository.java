package com.civnexa.repository;

import com.civnexa.entity.Department;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUserReference(String userReference);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByRollNumber(String rollNumber);

    Optional<User> findByEnrollmentNumber(String enrollmentNumber);

    Optional<User> findByQrToken(String qrToken);

    List<User> findByRole(RoleType role);

    List<User> findByRoleAndDepartment(RoleType role, Department department);

    List<User> findByDepartment(Department department);

    Page<User> findByRole(RoleType role, Pageable pageable);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUserReference(String userReference);

    boolean existsByRollNumber(String rollNumber);

    boolean existsByRole(RoleType role);

    List<User> findByStatusIn(List<String> statuses);

    Page<User> findByStatus(String status, Pageable pageable);

    Page<User> findByStatusIn(List<String> statuses, Pageable pageable);
}
