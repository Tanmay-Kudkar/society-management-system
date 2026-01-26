package com.society.backend.service.complaint;

import com.society.backend.dto.complaint.ComplaintRequest;
import com.society.backend.dto.complaint.ComplaintResponse;
import com.society.backend.entity.Complaint;
import com.society.backend.entity.User;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.complaint.ComplaintRepository;
import com.society.backend.repository.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository, UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
    }

    @Override
    public ComplaintResponse create(Long userId, ComplaintRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Complaint complaint = new Complaint();
        complaint.setUser(user);
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setStatus("PENDING");
        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    @Override
    public List<ComplaintResponse> getAll() {
        return complaintRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getByUser(Long userId) {
        return complaintRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ComplaintResponse> getByStatus(String status) {
        return complaintRepository.findByStatus(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ComplaintResponse getById(Long id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        return toResponse(complaint);
    }

    @Override
    public ComplaintResponse updateStatus(Long id, String status) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Complaint not found"));
        complaint.setStatus(status);
        Complaint saved = complaintRepository.save(complaint);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        if (!complaintRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Complaint not found");
        }
        complaintRepository.deleteById(id);
    }

    private ComplaintResponse toResponse(Complaint complaint) {
        return new ComplaintResponse(
                complaint.getId(),
                complaint.getUser().getId(),
                complaint.getUser().getName(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getStatus(),
                complaint.getCreatedAt());
    }
}
