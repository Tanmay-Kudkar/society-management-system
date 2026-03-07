package com.society.backend.society.repository;

import com.society.backend.society.entity.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Long> {
    List<DocumentTemplate> findByTemplateType(String templateType);

    List<DocumentTemplate> findByIsActiveTrue();
}
