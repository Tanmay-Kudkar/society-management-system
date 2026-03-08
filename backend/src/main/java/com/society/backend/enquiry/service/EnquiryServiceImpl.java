package com.society.backend.enquiry.service;

import com.society.backend.common.exception.ApiException;
import com.society.backend.common.service.EmailService;
import com.society.backend.enquiry.dto.request.EnquiryRequest;
import com.society.backend.enquiry.dto.response.EnquiryResponse;
import com.society.backend.enquiry.entity.Enquiry;
import com.society.backend.enquiry.repository.EnquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryServiceImpl implements EnquiryService {

    private final EnquiryRepository enquiryRepository;
    private final EmailService emailService;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Override
    @Transactional
    public EnquiryResponse submit(EnquiryRequest request) {
        // Block repeated submissions from the same phone within 24 hours
        if (enquiryRepository.existsByPhoneAndSubmittedAtAfter(
                request.getPhone().trim(), LocalDateTime.now().minusHours(24))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "An enquiry from this phone number was already submitted. Please try again after 24 hours.");
        }

        Enquiry enquiry = new Enquiry();
        enquiry.setName(request.getName().trim());
        enquiry.setPhone(request.getPhone().trim());
        enquiry.setReason(request.getReason());

        Enquiry saved = enquiryRepository.save(enquiry);
        log.info("New society enquiry received from {} ({}), reason: {}", saved.getName(), saved.getPhone(), saved.getReason());

        // Notify admin asynchronously - if email fails, enquiry is already saved
        try {
            String subject = "[SocietyHub] New Enrolment Enquiry – " + saved.getReason();
            String body = String.format(
                "A new enquiry has been submitted on the SocietyHub landing page.\n\n" +
                "Name  : %s\n" +
                "Phone : +91 %s\n" +
                "Reason: %s\n" +
                "Time  : %s\n\n" +
                "Please follow up at your earliest convenience.",
                saved.getName(), saved.getPhone(), saved.getReason(), saved.getSubmittedAt()
            );
            emailService.sendSimpleEmail(adminEmail, subject, body);
        } catch (Exception e) {
            log.warn("Failed to send enquiry notification email: {}", e.getMessage());
        }

        return mapToResponse(saved);
    }

    @Override
    public List<EnquiryResponse> getAll() {
        return enquiryRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private EnquiryResponse mapToResponse(Enquiry enquiry) {
        EnquiryResponse response = new EnquiryResponse();
        response.setId(enquiry.getId());
        response.setName(enquiry.getName());
        response.setPhone(enquiry.getPhone());
        response.setReason(enquiry.getReason());
        response.setSubmittedAt(enquiry.getSubmittedAt());
        return response;
    }
}
