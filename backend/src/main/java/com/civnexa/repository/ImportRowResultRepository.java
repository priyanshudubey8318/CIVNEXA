package com.civnexa.repository;

import com.civnexa.entity.ImportJob;
import com.civnexa.entity.ImportRowResult;
import com.civnexa.entity.enums.RowProcessingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImportRowResultRepository extends JpaRepository<ImportRowResult, Long> {

    List<ImportRowResult> findByImportJobOrderByRowNumberAsc(ImportJob importJob);

    List<ImportRowResult> findByImportJobAndStatus(ImportJob importJob, RowProcessingStatus status);

    long countByImportJobAndStatus(ImportJob importJob, RowProcessingStatus status);

    void deleteByImportJob(ImportJob importJob);
}
