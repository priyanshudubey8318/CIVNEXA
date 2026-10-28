package com.civnexa;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class CivnexaBackendApplicationTests {

    @Test
    @DisplayName("Spring Boot Application Context loads successfully")
    void contextLoads() {
    }

}
