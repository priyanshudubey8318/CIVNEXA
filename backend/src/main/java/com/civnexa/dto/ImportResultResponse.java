package com.civnexa.dto;

import java.util.ArrayList;
import java.util.List;

public class ImportResultResponse {

    private String fileName;
    private String fileChecksum;
    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<RowError> errors = new ArrayList<>();
    private List<UserResponse> importedUsers = new ArrayList<>();

    public ImportResultResponse() {
    }

    public ImportResultResponse(String fileName, String fileChecksum, int totalRows, int successCount, int failureCount) {
        this.fileName = fileName;
        this.fileChecksum = fileChecksum;
        this.totalRows = totalRows;
        this.successCount = successCount;
        this.failureCount = failureCount;
    }

    public static class RowError {
        private int rowNumber;
        private String identifier;
        private String reason;

        public RowError() {
        }

        public RowError(int rowNumber, String identifier, String reason) {
            this.rowNumber = rowNumber;
            this.identifier = identifier;
            this.reason = reason;
        }

        public int getRowNumber() {
            return rowNumber;
        }

        public void setRowNumber(int rowNumber) {
            this.rowNumber = rowNumber;
        }

        public String getIdentifier() {
            return identifier;
        }

        public void setIdentifier(String identifier) {
            this.identifier = identifier;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileChecksum() {
        return fileChecksum;
    }

    public void setFileChecksum(String fileChecksum) {
        this.fileChecksum = fileChecksum;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public int getSuccessCount() {
        return successCount;
    }

    public void setSuccessCount(int successCount) {
        this.successCount = successCount;
    }

    public int getFailureCount() {
        return failureCount;
    }

    public void setFailureCount(int failureCount) {
        this.failureCount = failureCount;
    }

    public List<RowError> getErrors() {
        return errors;
    }

    public void setErrors(List<RowError> errors) {
        this.errors = errors;
    }

    public List<UserResponse> getImportedUsers() {
        return importedUsers;
    }

    public void setImportedUsers(List<UserResponse> importedUsers) {
        this.importedUsers = importedUsers;
    }
}
