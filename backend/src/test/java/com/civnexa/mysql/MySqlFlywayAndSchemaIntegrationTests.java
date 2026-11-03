package com.civnexa.mysql;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("mysql")
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_TESTS", matches = "true")
@DisplayName("Real MySQL 8 — Flyway Migrations & Schema Structure Integration Tests")
public class MySqlFlywayAndSchemaIntegrationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Verify Flyway migrations V1 through V6 succeeded on native MySQL")
    void testFlywayMigrationsSucceeded() {
        List<Map<String, Object>> appliedMigrations = jdbcTemplate.queryForList(
                "SELECT version, description, type, success FROM civnexa_test.flyway_schema_history ORDER BY installed_rank ASC"
        );

        assertThat(appliedMigrations).isNotEmpty();
        for (Map<String, Object> migration : appliedMigrations) {
            Object success = migration.get("success");
            assertThat(success).isIn(true, 1, 1L, (short) 1);
        }

        List<String> versions = appliedMigrations.stream()
                .map(m -> (String) m.get("version"))
                .toList();

        assertThat(versions).contains("1", "2", "3", "4", "5", "6");
    }

    @Test
    @DisplayName("Verify all required institutional tables exist in civnexa_test schema")
    void testTablesExistInSchema() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'civnexa_test'",
                String.class
        );

        assertThat(tables).contains(
                "ai_knowledge_documents",
                "appeals",
                "attendance_records",
                "attendance_sessions",
                "audit_logs",
                "case_activities",
                "case_categories",
                "case_investigation_notes",
                "cases",
                "counseling_referrals",
                "counseling_sessions",
                "departments",
                "email_verifications",
                "evidence_custody_logs",
                "evidence_items",
                "hearing_committee_members",
                "hearings",
                "import_jobs",
                "import_row_results",
                "revoked_tokens",
                "student_responses",
                "users",
                "flyway_schema_history"
        );
    }

    @Test
    @DisplayName("Verify all institutional tables use InnoDB storage engine on native MySQL")
    void testTablesUseInnoDB() {
        List<Map<String, Object>> engines = jdbcTemplate.queryForList(
                "SELECT table_name, engine FROM information_schema.tables WHERE table_schema = 'civnexa_test' AND table_type = 'BASE TABLE'"
        );

        for (Map<String, Object> entry : engines) {
            String engine = (String) entry.get("engine");
            assertThat(engine).isEqualToIgnoringCase("InnoDB");
        }
    }

    @Test
    @DisplayName("Verify initial seed categories are populated in MySQL from V6 migration")
    void testV6SeedCategoriesExist() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM civnexa_test.case_categories",
                Integer.class
        );

        assertThat(count).isGreaterThanOrEqualTo(6);

        List<String> categoryKeys = jdbcTemplate.queryForList(
                "SELECT category_key FROM civnexa_test.case_categories",
                String.class
        );

        assertThat(categoryKeys).contains(
                "DISCIPLINE",
                "ACADEMIC_GRIEVANCE",
                "CAMPUS_SAFETY",
                "HARASSMENT",
                "RAGGING",
                "FACILITIES_INFRASTRUCTURE"
        );
    }
}
