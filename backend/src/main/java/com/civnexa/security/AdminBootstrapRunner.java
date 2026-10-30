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

import java.time.Instant;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
        if (userRepository.existsByRole(RoleType.SUPER_ADMIN)) {
            log.info("Institutional Super Admin accounts already exist in database. Bootstrap skipped.");
            return;
        }

        if (bootstrapEmail == null || bootstrapEmail.trim().isEmpty() ||
            bootstrapPassword == null || bootstrapPassword.trim().isEmpty()) {
            log.info("No Super Admin detected and no bootstrap credentials configured in environment. Skipping auto-bootstrap.");
            return;
        }

        String email = bootstrapEmail.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            log.warn("Cannot bootstrap administrator: Email address is already registered: {}", maskEmail(email));
            return;
        }

        User admin = new User();
        admin.setUserReference("ADM-ROOT-001");
        admin.setName(bootstrapName.trim());
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
        admin.setRole(RoleType.SUPER_ADMIN);
        admin.setStatus(AuthService.STATUS_ACTIVE);
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());

        userRepository.save(admin);
        log.info("Initial institutional Super Admin bootstrapped successfully with email={}", maskEmail(email));
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}
