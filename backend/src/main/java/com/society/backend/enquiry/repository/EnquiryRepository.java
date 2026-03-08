package com.society.backend.enquiry.repository;

import com.society.backend.enquiry.entity.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    boolean existsByPhoneAndSubmittedAtAfter(String phone, LocalDateTime after);
}
