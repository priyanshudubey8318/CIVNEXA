package com.civnexa.storage;

import com.civnexa.exception.ApiException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
public class FileSystemEvidenceStorageService implements EvidenceStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileSystemEvidenceStorageService.class);

    public static final long DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024L; // 25 MB

    private static final List<String> DISALLOWED_EXTENSIONS = Arrays.asList(
            ".exe", ".bat", ".cmd", ".sh", ".vbs", ".ps1", ".msi", ".dll", ".com", ".scr", ".jar", ".war", ".php", ".phtml", ".jsp"
    );

    @Value("${civnexa.storage.location:${CIVNEXA_STORAGE_PATH:vault_storage}}")
    private String storageLocation;

    @Value("${civnexa.storage.max-file-size:26214400}")
    private long maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES;

    private Path rootLocation;

    public FileSystemEvidenceStorageService() {
    }

    public FileSystemEvidenceStorageService(String storageLocation) {
        this.storageLocation = storageLocation;
        init();
    }

    @PostConstruct
    public void init() {
        if (storageLocation == null || storageLocation.isBlank()) {
            this.storageLocation = "vault_storage";
        }
        this.rootLocation = Paths.get(storageLocation).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Initialized secure persistent evidence storage at: {}", this.rootLocation);
        } catch (IOException e) {
            throw new IllegalStateException("Could not initialize evidence storage directory: " + this.rootLocation, e);
        }
    }

    @Override
    public String store(String storageKey, InputStream inputStream, long sizeBytes, String contentType) {
        if (sizeBytes > maxFileSizeBytes) {
            throw new ApiException("Evidence file exceeds maximum permitted size of " + (maxFileSizeBytes / (1024 * 1024)) + " MB", HttpStatus.BAD_REQUEST);
        }

        validateStorageKey(storageKey);
        validateContentTypeAndExtension(storageKey, contentType);

        Path destinationFile = resolveAndValidate(storageKey);

        try {
            Files.createDirectories(destinationFile.getParent());
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Persisted evidence file ({} bytes) to storageKey={}", sizeBytes, storageKey);
            return storageKey;
        } catch (IOException e) {
            log.error("Failed to store evidence file to storageKey={}: {}", storageKey, e.getMessage());
            throw new ApiException("Failed to persist evidence file to storage: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public Resource retrieve(String storageKey) {
        validateStorageKey(storageKey);
        Path file = resolveAndValidate(storageKey);

        if (!Files.exists(file) || !Files.isReadable(file)) {
            throw new ApiException("Evidence binary file is not available in vault storage", HttpStatus.NOT_FOUND);
        }

        try {
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ApiException("Evidence binary file is unreadable", HttpStatus.NOT_FOUND);
            }
        } catch (MalformedURLException e) {
            throw new ApiException("Invalid evidence storage reference URL: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public boolean exists(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) return false;
        try {
            validateStorageKey(storageKey);
            Path file = resolveAndValidate(storageKey);
            return Files.exists(file) && Files.isRegularFile(file);
        } catch (Exception ex) {
            return false;
        }
    }

    @Override
    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) return;
        try {
            validateStorageKey(storageKey);
            Path file = resolveAndValidate(storageKey);
            if (Files.exists(file)) {
                Files.delete(file);
                log.info("Deleted evidence storage artifact: {}", storageKey);
            }
        } catch (Exception e) {
            log.warn("Failed to delete evidence file at storageKey={}: {}", storageKey, e.getMessage());
        }
    }

    private void validateStorageKey(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            throw new ApiException("Storage key cannot be empty", HttpStatus.BAD_REQUEST);
        }
        if (storageKey.contains("..") || storageKey.contains("\0")) {
            throw new ApiException("Path traversal attempt detected in storage reference: " + storageKey, HttpStatus.BAD_REQUEST);
        }
    }

    private void validateContentTypeAndExtension(String filename, String contentType) {
        String lowerFilename = filename != null ? filename.toLowerCase(Locale.ROOT) : "";
        for (String disallowed : DISALLOWED_EXTENSIONS) {
            if (lowerFilename.endsWith(disallowed)) {
                throw new ApiException("Disallowed executable file type rejected: " + disallowed, HttpStatus.BAD_REQUEST);
            }
        }

        if (contentType != null) {
            String lowerContent = contentType.toLowerCase(Locale.ROOT);
            if (lowerContent.contains("x-msdownload") || lowerContent.contains("x-executable") ||
                lowerContent.contains("x-sh") || lowerContent.contains("x-bat") || lowerContent.contains("x-csh")) {
                throw new ApiException("Disallowed executable MIME content type rejected: " + contentType, HttpStatus.BAD_REQUEST);
            }
        }
    }

    private Path resolveAndValidate(String storageKey) {
        // Strip any leading slashes to prevent root escaping
        String sanitized = storageKey.replace('\\', '/');
        while (sanitized.startsWith("/")) {
            sanitized = sanitized.substring(1);
        }

        Path resolved = this.rootLocation.resolve(sanitized).normalize();
        if (!resolved.startsWith(this.rootLocation)) {
            throw new ApiException("Path traversal violation: storage reference escapes vault root", HttpStatus.BAD_REQUEST);
        }
        return resolved;
    }

    public Path getRootLocation() {
        return rootLocation;
    }
}
