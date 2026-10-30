package com.civnexa.security;

import com.civnexa.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class PasswordValidatorTests {

    @ParameterizedTest
    @ValueSource(strings = {
            "SecurePass@123",
            "P@ssw0rd2026!",
            "Admin#999_Valid",
            "Complex$tudent!1"
    })
    @DisplayName("Valid passwords meeting all complexity rules pass validation")
    void testValidPasswords(String password) {
        assertTrue(PasswordValidator.isValid(password));
        assertDoesNotThrow(() -> PasswordValidator.validate(password));
    }

    @Test
    @DisplayName("Null or empty password fails validation")
    void testNullOrBlankPassword() {
        assertFalse(PasswordValidator.isValid(null));
        assertFalse(PasswordValidator.isValid(""));
        assertFalse(PasswordValidator.isValid("   "));

        ApiException exNull = assertThrows(ApiException.class, () -> PasswordValidator.validate(null));
        assertEquals(HttpStatus.BAD_REQUEST, exNull.getStatus());
        assertTrue(exNull.getMessage().contains("Password cannot be blank"));

        ApiException exBlank = assertThrows(ApiException.class, () -> PasswordValidator.validate("   "));
        assertEquals(HttpStatus.BAD_REQUEST, exBlank.getStatus());
    }

    @Test
    @DisplayName("Password shorter than 8 characters is rejected")
    void testTooShortPassword() {
        String shortPass = "P@1aB";
        assertFalse(PasswordValidator.isValid(shortPass));

        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(shortPass));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("at least 8 characters"));
    }

    @Test
    @DisplayName("Password of exactly 72 ASCII bytes passes validation")
    void testExactly72AsciiBytesPasses() {
        // "A1!" (3 bytes) + "a".repeat(69) (69 bytes) = 72 bytes total
        String pass72 = "A1!" + "a".repeat(69);
        assertEquals(72, pass72.length());
        assertEquals(72, pass72.getBytes(StandardCharsets.UTF_8).length);

        assertTrue(PasswordValidator.isValid(pass72));
        assertDoesNotThrow(() -> PasswordValidator.validate(pass72));
    }

    @Test
    @DisplayName("Password of 73 ASCII bytes is rejected (BCrypt input limit)")
    void test73AsciiBytesRejected() {
        // "A1!" (3 bytes) + "a".repeat(70) (70 bytes) = 73 bytes total
        String pass73 = "A1!" + "a".repeat(70);
        assertEquals(73, pass73.length());
        assertEquals(73, pass73.getBytes(StandardCharsets.UTF_8).length);

        assertFalse(PasswordValidator.isValid(pass73));
        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(pass73));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("72 UTF-8 bytes"));
    }

    @Test
    @DisplayName("Multibyte Unicode password within 72 bytes passes while exceeding 72 bytes fails regardless of char length")
    void testMultibyteUnicodeLengthEvaluation() {
        // Euro symbol '€' (U+20AC) encodes to 3 bytes in UTF-8
        // "A1!a" (4 bytes) + 22 '€' (66 bytes) = 70 UTF-8 bytes with string length 26
        String validMultibyte = "A1!a" + "€".repeat(22);
        assertEquals(26, validMultibyte.length());
        assertEquals(70, validMultibyte.getBytes(StandardCharsets.UTF_8).length);
        assertTrue(PasswordValidator.isValid(validMultibyte));
        assertDoesNotThrow(() -> PasswordValidator.validate(validMultibyte));

        // "A1!a" (4 bytes) + 23 '€' (69 bytes) = 73 UTF-8 bytes with string length 27
        String overLimitMultibyte = "A1!a" + "€".repeat(23);
        assertEquals(27, overLimitMultibyte.length());
        assertEquals(73, overLimitMultibyte.getBytes(StandardCharsets.UTF_8).length);
        assertFalse(PasswordValidator.isValid(overLimitMultibyte));

        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(overLimitMultibyte));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("72 UTF-8 bytes"));
    }

    @Test
    @DisplayName("Password missing uppercase letter is rejected")
    void testMissingUppercase() {
        String noUpper = "password@123";
        assertFalse(PasswordValidator.isValid(noUpper));

        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(noUpper));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("uppercase letter"));
    }

    @Test
    @DisplayName("Password missing lowercase letter is rejected")
    void testMissingLowercase() {
        String noLower = "PASSWORD@123";
        assertFalse(PasswordValidator.isValid(noLower));

        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(noLower));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("lowercase letter"));
    }

    @Test
    @DisplayName("Password missing digit is rejected")
    void testMissingDigit() {
        String noDigit = "Password@NoDigit";
        assertFalse(PasswordValidator.isValid(noDigit));

        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(noDigit));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("digit"));
    }

    @Test
    @DisplayName("Password missing special character is rejected")
    void testMissingSpecialCharacter() {
        String noSpecial = "Password12345";
        assertFalse(PasswordValidator.isValid(noSpecial));

        ApiException ex = assertThrows(ApiException.class, () -> PasswordValidator.validate(noSpecial));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("special character"));
    }
}
