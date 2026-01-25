package com.society.backend.service;

import com.society.backend.dto.ContractRequest;
import com.society.backend.dto.ContractResponse;

import java.util.List;

public interface ContractService {
    ContractResponse create(ContractRequest request, Long userId);

    ContractResponse getById(Long id);

    List<ContractResponse> getBySocietyId(Long societyId);

    List<ContractResponse> getByContractType(String contractType);

    List<ContractResponse> getExpiringSoon(Long societyId, int days);

    List<ContractResponse> getAll();

    ContractResponse update(Long id, ContractRequest request, Long userId);

    ContractResponse deactivate(Long id, Long userId);

    void delete(Long id, Long userId);
}
