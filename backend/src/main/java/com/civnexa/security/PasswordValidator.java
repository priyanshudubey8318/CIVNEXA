package com.civnexa.security;

import com.civnexa.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

/**
 * Validates password complexity against the CIVNEXA institutional security policy:
 * - Minimum 8 characters.
 * - Maximum 72 UTF-8 bytes (enforced strictly to prevent BCrypt truncation).
 * - At least one uppercase letter (A-Z).
 * - At least one lowercase letter (a-z).
 * - At least one decimal digit (0-9).
 * - At least one special symbol.
 */
public final class PasswordValidator {

    public static final int MIN_LENGTH = 8;
    public static final int MAX_UTF8_BYTES = 72;

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?~`]");

    private PasswordValidator() {
        // Utility class
    }

    /**
     * Checks whether the given password satisfies the institutional complexity policy.
     * Evaluates length in UTF-8 bytes rather than Java characters to preserve BCrypt compatibility.
     *
     * @param password Raw plaintext password
     * @return true if valid, false otherwise
     */
    public static boolean isValid(String password) {
        if (password == null) {
            return false;
        }
        if (password.length() < MIN_LENGTH) {
            return false;
        }
        byte[] utf8Bytes = password.getBytes(StandardCharsets.UTF_8);
        if (utf8Bytes.length > MAX_UTF8_BYTES) {
            return false;
        }
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            return false;
        }
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            return false;
        }
        if (!DIGIT_PATTERN.matcher(password).find()) {
            return false;
        }
        return SPECIAL_CHAR_PATTERN.matcher(password).find();
    }

    /**
     * Validates the given password and throws an ApiException with descriptive feedback if non-compliant.
     * Rejects passwords exceeding 72 UTF-8 bytes before BCrypt encoding to prevent silent truncation.
     *
     * @param password Raw plaintext password
     * @throws ApiException if the password fails complexity rules
     */
    public static void validate(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new ApiException("Password cannot be blank", HttpStatus.BAD_REQUEST);
        }
        if (password.length() < MIN_LENGTH) {
            throw new ApiException("Password must be at least " + MIN_LENGTH + " characters long", HttpStatus.BAD_REQUEST);
        }
        byte[] utf8Bytes = password.getBytes(StandardCharsets.UTF_8);
        if (utf8Bytes.length > MAX_UTF8_BYTES) {
            throw new ApiException("Password cannot exceed " + MAX_UTF8_BYTES + " UTF-8 bytes (BCrypt input limit)", HttpStatus.BAD_REQUEST);
        }
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one uppercase letter", HttpStatus.BAD_REQUEST);
        }
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one lowercase letter", HttpStatus.BAD_REQUEST);
        }
        if (!DIGIT_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one digit", HttpStatus.BAD_REQUEST);
        }
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            throw new ApiException("Password must contain at least one special character (!@#$%^&*...)", HttpStatus.BAD_REQUEST);
        }
    }
}
