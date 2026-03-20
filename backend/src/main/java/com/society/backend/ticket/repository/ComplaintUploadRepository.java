package com.society.backend.ticket.repository;

import com.society.backend.ticket.entity.ComplaintUpload;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintUploadRepository extends JpaRepository<ComplaintUpload, Long> {
}
