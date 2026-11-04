package com.civnexa.storage;

import org.springframework.core.io.Resource;

import java.io.InputStream;

/**
 * Storage abstraction for persistent binary evidence payloads.
 * Supports local filesystem and S3/cloud storage implementations.
 */
public interface EvidenceStorageService {

    /**
     * Stores a binary evidence stream under a sanitized, generated storage key.
     *
     * @param storageKey  A generated, path-traversal safe storage identifier
     * @param inputStream The binary content stream
     * @param sizeBytes   Size in bytes
     * @param contentType MIME type
     * @return The stored relative storage reference
     */
    String store(String storageKey, InputStream inputStream, long sizeBytes, String contentType);

    /**
     * Retrieves the stored evidence binary as a Spring Resource.
     *
     * @param storageKey The storage identifier
     * @return Spring Resource for streaming
     */
    Resource retrieve(String storageKey);

    /**
     * Checks if the binary exists in storage.
     */
    boolean exists(String storageKey);

    /**
     * Deletes the stored binary if present (e.g. on rollback or cleanup).
     */
    void delete(String storageKey);
}
