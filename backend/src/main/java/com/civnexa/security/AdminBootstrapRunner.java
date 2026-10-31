package com.civnexa.security;

import com.civnexa.entity.User;
import com.civnexa.entity.enums.RoleType;
import com.civnexa.repository.UserRepository;
import com.civnexa.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Hardened Super Admin Initial Bootstrap Runner.
 *
 * Requirements:
 * 1. Never creates an account silently with a known fixed password.
 * 2. Requires explicit enablement via civnexa.bootstrap.admin.enabled (CIVNEXA_ENABLE_INITIAL_BOOTSTRAP=true).
 * 3. Requires an explicitly supplied administrator email (CIVNEXA_BOOTSTRAP_ADMIN_EMAIL).
 * 4. Requires a strong password via CIVNEXA_BOOTSTRAP_ADMIN_PASSWORD or generates a cryptographically strong 24-character one.
 * 5. Strictly refuses bootstrap if a SUPER_ADMIN already exists.
 * 6. Never logs initial passwords in application logs.
 * 7. Enforces password change on first sign-in (passwordChangeRequired = true).
 * 8. Zero public administrator registration endpoints.
 */
@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String CHAR_DIGIT = "0123456789";
    private static final String CHAR_SPECIAL = "!@#$%^&*()-_=+[]{}";
    private static final String ALL_CHARS = CHAR_LOWER + CHAR_UPPER + CHAR_DIGIT + CHAR_SPECIAL;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${civnexa.bootstrap.admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${civnexa.bootstrap.admin.email:}")
    private String bootstrapEmail;

    @Value("${civnexa.bootstrap.admin.password:}")
    private String bootstrapPassword;

    @Value("${civnexa.bootstrap.admin.name:Platform Administrator}")
    private String bootstrapName;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        // 1. Refuse additional bootstrap if SUPER_ADMIN exists
        if (userRepository.existsByRole(RoleType.SUPER_ADMIN)) {
            log.info("Institutional Super Admin accounts exist in database. Administrator bootstrap refused.");
            return;
        }

        // 2. Require explicit configuration
        if (!bootstrapEnabled) {
            log.info("Initial administrator bootstrap is disabled. Set CIVNEXA_ENABLE_INITIAL_BOOTSTRAP=true to initialize root administrator.");
            return;
        }

        // 3. Require explicitly supplied administrator email
        if (bootstrapEmail == null || bootstrapEmail.trim().isEmpty()) {
            log.warn("Administrator bootstrap is enabled but CIVNEXA_BOOTSTRAP_ADMIN_EMAIL is missing. Bootstrap aborted.");
            return;
        }

        String email = bootstrapEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            log.warn("Cannot bootstrap administrator: Email address is already registered: {}", maskEmail(email));
            return;
        }

        // 4. Handle initial password
        String effectivePassword;
        boolean generatedLocally = false;

        if (bootstrapPassword != null && !bootstrapPassword.trim().isEmpty()) {
            if (!PasswordValidator.isValid(bootstrapPassword.trim())) {
                log.error("Supplied bootstrap administrator password failed institutional security policy.");
                throw new IllegalStateException("Supplied initial administrator password does not meet security criteria.");
            }
            effectivePassword = bootstrapPassword.trim();
        } else {
            effectivePassword = generateStrongPassword(24);
            generatedLocally = true;
        }

        // 5. Persist administrator
        User admin = new User();
        admin.setUserReference("ADM-ROOT-001");
        admin.setName(bootstrapName.trim());
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(effectivePassword));
        admin.setRole(RoleType.SUPER_ADMIN);
        admin.setStatus(AuthService.STATUS_ACTIVE);
        admin.setPasswordChangeRequired(true);
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());

        userRepository.save(admin);

        // 6. Output secure one-time notice without logging the password to stdout/logs
        if (generatedLocally) {
            saveOneTimeCredentialFile(email, effectivePassword);
            log.warn("Generated a secure initial administrator password written to 'civnexa-bootstrap-admin.credential'. Administrator MUST change password upon first sign-in.");
        } else {
            log.info("Initial institutional Super Admin bootstrapped successfully with email={}. Password change required on first sign-in.", maskEmail(email));
        }
    }

    public static String generateStrongPassword(int length) {
        StringBuilder sb = new StringBuilder(Math.max(16, length));
        sb.append(CHAR_UPPER.charAt(SECURE_RANDOM.nextInt(CHAR_UPPER.length())));
        sb.append(CHAR_LOWER.charAt(SECURE_RANDOM.nextInt(CHAR_LOWER.length())));
        sb.append(CHAR_DIGIT.charAt(SECURE_RANDOM.nextInt(CHAR_DIGIT.length())));
        sb.append(CHAR_SPECIAL.charAt(SECURE_RANDOM.nextInt(CHAR_SPECIAL.length())));

        for (int i = 4; i < length; i++) {
            sb.append(ALL_CHARS.charAt(SECURE_RANDOM.nextInt(ALL_CHARS.length())));
        }

        char[] arr = sb.toString().toCharArray();
        for (int i = arr.length - 1; i > 0; i--) {
            int j = SECURE_RANDOM.nextInt(i + 1);
            char temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return new String(arr);
    }

    private void saveOneTimeCredentialFile(String email, String password) {
        try {
            File credFile = new File("civnexa-bootstrap-admin.credential");
            try (FileWriter writer = new FileWriter(credFile)) {
                writer.write("====================================================================\n");
                writer.write("CIVNEXA ONE-TIME INITIAL SUPER ADMIN CREDENTIAL\n");
                writer.write("====================================================================\n");
                writer.write("Email:    " + email + "\n");
                writer.write("Password: " + password + "\n");
                writer.write("Notice:   You must change this password immediately upon first login.\n");
                writer.write("          Delete this file once stored in your password manager.\n");
                writer.write("====================================================================\n");
            }
            credFile.setReadable(false, false);
            credFile.setReadable(true, true);
            credFile.setWritable(false, false);
            credFile.setWritable(true, true);
        } catch (IOException e) {
            log.error("Failed to write one-time credential file: {}", e.getMessage());
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}
