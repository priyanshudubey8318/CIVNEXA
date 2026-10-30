package com.civnexa.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${civnexa.mail.from:no-reply@civnexa.edu}")
    private String fromEmail;

    @Value("${civnexa.mail.enabled:true}")
    private boolean mailEnabled;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends a 6-digit OTP to the student for institutional email verification.
     * Note: The OTP is NEVER logged to preserve verification secrecy.
     */
    public void sendVerificationOtp(String toEmail, String otp) {
        if (!mailEnabled || mailSender == null) {
            log.info("Email dispatch simulated (mailSender not configured or mail disabled): verification challenge generated for email={}", maskEmail(toEmail));
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("CIVNEXA — Institutional Email Verification Code");
            message.setText("Welcome to CIVNEXA.\n\n" +
                    "Your 6-digit email verification code is: " + otp + "\n\n" +
                    "This code will expire in 10 minutes. If you did not initiate this registration request, please disregard this message.\n\n" +
                    "— CIVNEXA Campus Safety & Conduct Administration");

            mailSender.send(message);
            log.info("Email verification challenge successfully dispatched to recipient={}", maskEmail(toEmail));
        } catch (Exception e) {
            log.warn("Failed to dispatch email verification to recipient={}: {}", maskEmail(toEmail), e.getMessage());
        }
    }

    public void sendAccountApprovedNotification(String toEmail, String name) {
        if (!mailEnabled || mailSender == null) {
            log.info("Account approval email dispatch simulated for recipient={}", maskEmail(toEmail));
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("CIVNEXA — Institutional Account Approved");
            message.setText("Dear " + name + ",\n\n" +
                    "Your CIVNEXA institutional student account has been approved by the administration. You may now log in to the portal using your institutional credentials.\n\n" +
                    "— CIVNEXA Administration");

            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to dispatch approval email to recipient={}: {}", maskEmail(toEmail), e.getMessage());
        }
    }

    public void sendAccountRejectedNotification(String toEmail, String name, String reason) {
        if (!mailEnabled || mailSender == null) {
            log.info("Account rejection email dispatch simulated for recipient={}", maskEmail(toEmail));
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("CIVNEXA — Institutional Account Registration Update");
            message.setText("Dear " + name + ",\n\n" +
                    "Your CIVNEXA account registration request could not be approved at this time.\n\n" +
                    "Reason: " + (reason != null && !reason.isBlank() ? reason : "Institutional roster verification could not be confirmed.") + "\n\n" +
                    "Please contact your department coordinator or university registrar for assistance.\n\n" +
                    "— CIVNEXA Administration");

            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to dispatch rejection email to recipient={}: {}", maskEmail(toEmail), e.getMessage());
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        return email.charAt(0) + "***" + email.substring(atIdx);
    }
}
