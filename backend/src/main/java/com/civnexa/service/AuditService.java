package com.civnexa.service;

import com.civnexa.entity.AuditLog;
import com.civnexa.entity.User;
import com.civnexa.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void recordEvent(String action, String entityType, String entityId, User actor, String description) {
        String actorName = actor != null && actor.getName() != null ? actor.getName() : "SYSTEM";
        String actorRole = actor != null && actor.getRole() != null ? actor.getRole().name() : "SYSTEM";
        // Ensure actor is an existing managed entity before linking foreign key reference
        User persistentActor = (actor != null && actor.getId() != null) ? actor : null;
        AuditLog auditLog = new AuditLog(action, entityType, entityId, persistentActor, actorName, actorRole, description);
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
}
