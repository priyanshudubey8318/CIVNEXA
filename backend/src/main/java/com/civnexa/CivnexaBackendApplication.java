package com.civnexa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CivnexaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CivnexaBackendApplication.class, args);
	}

}

