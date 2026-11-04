package com.civnexa.mysql;

import com.civnexa.entity.*;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("mysql")
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_TESTS", matches = "true")
@DisplayName("Real MySQL 8 — Foreign Keys, Unique Constraints & Transaction Rollbacks")
public class MySqlConstraintsAndRollbackIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private RevokedTokenRepository revokedTokenRepository;

    @Autowired
    private com.civnexa.security.jwt.TokenBlacklistService tokenBlacklistService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @AfterEach
    void cleanUp() {
        jdbcTemplate.execute("DELETE FROM civnexa_test.evidence_items WHERE file_name LIKE 'test-mysql-%'");
        jdbcTemplate.execute("DELETE FROM civnexa_test.hearings WHERE hearing_number LIKE 'H-MYSQL-%'");
        jdbcTemplate.execute("DELETE FROM civnexa_test.cases WHERE case_number LIKE 'CX-MYSQL-%'");
        jdbcTemplate.execute("DELETE FROM civnexa_test.users WHERE email LIKE '%@mysql-test.edu'");
        jdbcTemplate.execute("DELETE FROM civnexa_test.departments WHERE code LIKE 'TEST_MYSQL_%'");
        jdbcTemplate.execute("DELETE FROM civnexa_test.case_categories WHERE category_key LIKE 'TEST_MYSQL_%'");
        jdbcTemplate.execute("DELETE FROM civnexa_test.revoked_tokens WHERE token_id LIKE 'MYSQL-TEST-%'");
    }

    @Test
    @DisplayName("Verify unique constraint on user email in real MySQL")
    void testUniqueUserEmailConstraint() {
        String testEmail = "duplicate-" + UUID.randomUUID() + "@mysql-test.edu";

        User u1 = new User();
        u1.setUserReference("REF-" + UUID.randomUUID().toString().substring(0, 18));
        u1.setEmail(testEmail);
        u1.setPasswordHash("hashedPassword123");
        u1.setRole(RoleType.STUDENT);
        u1.setStatus("ACTIVE");
        u1.setName("User One");
        userRepository.saveAndFlush(u1);

        User u2 = new User();
        u2.setUserReference("REF-" + UUID.randomUUID().toString().substring(0, 18));
        u2.setEmail(testEmail);
        u2.setPasswordHash("hashedPassword456");
        u2.setRole(RoleType.FACULTY);
        u2.setStatus("ACTIVE");
        u2.setName("User Two");

        assertThatThrownBy(() -> userRepository.saveAndFlush(u2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify unique constraint on department code in real MySQL")
    void testUniqueDepartmentCodeConstraint() {
        String code = "TEST_MYSQL_DUPL";

        Department d1 = new Department();
        d1.setName("Department Alpha");
        d1.setCode(code);
        departmentRepository.saveAndFlush(d1);

        Department d2 = new Department();
        d2.setName("Department Beta");
        d2.setCode(code);

        assertThatThrownBy(() -> departmentRepository.saveAndFlush(d2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify unique constraint on case category key in real MySQL")
    void testUniqueCategoryCodeConstraint() {
        String catKey = "TEST_MYSQL_CAT";

        Category c1 = new Category();
        c1.setCategoryKey(catKey);
        c1.setLabel("Category One");
        c1.setDescription("Testing MySQL category");
        categoryRepository.saveAndFlush(c1);

        Category c2 = new Category();
        c2.setCategoryKey(catKey);
        c2.setLabel("Category Two");
        c2.setDescription("Duplicate testing category");

        assertThatThrownBy(() -> categoryRepository.saveAndFlush(c2))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify foreign key rejection when inserting evidence for nonexistent case in real MySQL")
    void testForeignKeyConstraintOnEvidence() {
        long nonExistentCaseId = 99999999L;
        long dummyUserId = 1L;

        assertThatThrownBy(() -> {
            jdbcTemplate.update(
                    "INSERT INTO civnexa_test.evidence_items (evidence_reference, case_id, uploader_id, file_name, file_type, file_size_bytes, storage_reference, sha256_checksum, is_confidential, uploaded_at) " +
                            "VALUES ('EV-NONEXISTENT', ?, ?, 'test-mysql-file.pdf', 'application/pdf', 1024, '/files/1.pdf', 'hash123', 0, NOW())",
                    nonExistentCaseId, dummyUserId
            );
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Verify transaction rollback on real MySQL InnoDB engine")
    void testTransactionRollbackOnException() {
        String testEmail = "rollback-" + UUID.randomUUID() + "@mysql-test.edu";
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        try {
            txTemplate.execute(status -> {
                User u = new User();
                u.setUserReference("REF-" + UUID.randomUUID().toString().substring(0, 18));
                u.setEmail(testEmail);
                u.setPasswordHash("hashedPasswordRollback");
                u.setRole(RoleType.STUDENT);
                u.setStatus("ACTIVE");
                u.setName("Rollback User");
                userRepository.saveAndFlush(u);

                // Deliberately trigger an unhandled runtime exception to force rollback
                throw new IllegalStateException("Deliberate failure to test MySQL rollback");
            });
        } catch (IllegalStateException expected) {
            // Expected exception
        }

        // Verify with direct JDBC query that the user was NOT persisted to MySQL
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM civnexa_test.users WHERE email = ?",
                Integer.class,
                testEmail
        );

        assertThat(count).isEqualTo(0);
    }

    @Test
    @DisplayName("Verify scheduled revoked token cleanup in real MySQL")
    void testRevokedTokenCleanupInMySql() {
        String expiredJti = "MYSQL-TEST-EXP-" + UUID.randomUUID().toString().substring(0, 8);
        String activeJti = "MYSQL-TEST-ACT-" + UUID.randomUUID().toString().substring(0, 8);

        RevokedToken expired = new RevokedToken(expiredJti, "REF-EXP-USER", Instant.now().minusSeconds(1200));
        RevokedToken active = new RevokedToken(activeJti, "REF-ACT-USER", Instant.now().plusSeconds(1200));

        revokedTokenRepository.saveAndFlush(expired);
        revokedTokenRepository.saveAndFlush(active);

        assertThat(revokedTokenRepository.existsByTokenId(expiredJti)).isTrue();
        assertThat(revokedTokenRepository.existsByTokenId(activeJti)).isTrue();

        tokenBlacklistService.cleanupExpiredTokens();

        assertThat(revokedTokenRepository.existsByTokenId(expiredJti)).isFalse();
        assertThat(revokedTokenRepository.existsByTokenId(activeJti)).isTrue();
    }
}
