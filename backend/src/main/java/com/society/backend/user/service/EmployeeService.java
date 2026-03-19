package com.society.backend.user.service;

import com.society.backend.user.dto.request.EmployeeRequest;
import com.society.backend.user.dto.request.EmployeeIdProofMetadataRequest;
import com.society.backend.user.dto.response.EmployeeResponse;
import com.society.backend.user.dto.response.EmployeeIdProofDocumentPayload;
import com.society.backend.user.dto.response.EmployeeIdProofMetadataResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;

public interface EmployeeService {

    EmployeeResponse create(EmployeeRequest request, Long requesterId);

    EmployeeResponse update(Long id, EmployeeRequest request, Long requesterId);

    EmployeeResponse getById(Long id, Long requesterId);

    EmployeeResponse getByUserId(Long userId, Long requesterId);

    Page<EmployeeResponse> getBySociety(Long societyId, String department, Boolean isActive, Pageable pageable, Long requesterId);

    void delete(Long id, Long requesterId);

    EmployeeResponse deactivate(Long id, Long requesterId);

    EmployeeResponse recordAdvancePayment(Long id, BigDecimal amount, Long requesterId);

    EmployeeResponse deductAdvance(Long id, BigDecimal amount, Long requesterId);

    Map<String, Long> getCounts(Long societyId, Long requesterId);

    EmployeeIdProofMetadataResponse updateIdProofMetadata(Long id, EmployeeIdProofMetadataRequest request, Long requesterId);

    EmployeeIdProofMetadataResponse getIdProofMetadata(Long id, Long requesterId);

    EmployeeIdProofMetadataResponse uploadIdProofDocument(Long id, MultipartFile file, String idProofType, String idProofNumber, Long requesterId);

    EmployeeIdProofDocumentPayload downloadIdProofDocument(Long id, Long requesterId);
}
