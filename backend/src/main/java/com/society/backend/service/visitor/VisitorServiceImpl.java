package com.society.backend.service.visitor;

import com.society.backend.dto.visitor.VisitorRequest;
import com.society.backend.dto.visitor.VisitorResponse;
import com.society.backend.entity.Flat;
import com.society.backend.entity.Society;
import com.society.backend.entity.User;
import com.society.backend.entity.Visitor;
import com.society.backend.exception.ApiException;
import com.society.backend.repository.flat.FlatRepository;
import com.society.backend.repository.society.SocietyRepository;
import com.society.backend.repository.user.UserRepository;
import com.society.backend.repository.visitor.VisitorRepository;
import com.society.backend.service.common.RoleService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VisitorServiceImpl implements VisitorService {

    private final VisitorRepository visitorRepository;
    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final RoleService roleService;

    public VisitorServiceImpl(VisitorRepository visitorRepository, UserRepository userRepository,
            SocietyRepository societyRepository, FlatRepository flatRepository, RoleService roleService) {
        this.visitorRepository = visitorRepository;
        this.userRepository = userRepository;
        this.societyRepository = societyRepository;
        this.flatRepository = flatRepository;
        this.roleService = roleService;
    }

    @Override
    public VisitorResponse create(Long userId, VisitorRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Society society;
        if (request.getSocietyId() != null) {
            society = societyRepository.findById(request.getSocietyId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Society not found"));
            roleService.enforceSocietyScope(user, society.getId());
        } else if (user.getSociety() != null) {
            society = user.getSociety();
        } else {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Society ID is required");
        }

        Visitor visitor = new Visitor();
        visitor.setVisitorName(request.getVisitorName());
        visitor.setVisitorPhone(request.getVisitorPhone());
        visitor.setVisitorType(request.getVisitorType());
        visitor.setPurpose(request.getPurpose());
        visitor.setSociety(society);
        visitor.setOrganization(society.getOrganization());
        visitor.setVehicleNumber(request.getVehicleNumber());
        visitor.setExpectedArrival(request.getExpectedArrival());
        visitor.setNotes(request.getNotes());

        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flat not found"));
            visitor.setFlat(flat);
        }

        if (request.getIsPreApproved() != null && request.getIsPreApproved()) {
            visitor.setIsPreApproved(true);
            visitor.setApprovedBy(user);
            visitor.setStatus("EXPECTED");
        }

        Visitor saved = visitorRepository.save(visitor);
        return toResponse(saved);
    }

    @Override
    public List<VisitorResponse> getAll(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getRole().name().equals("MASTER_ADMIN")) {
            return visitorRepository.findAll().stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }

        if (user.getSociety() != null) {
            return visitorRepository.findBySocietyIdOrderByCreatedAtDesc(user.getSociety().getId()).stream()
                    .map(this::toResponse).collect(Collectors.toList());
        }

        return List.of();
    }

    @Override
    public List<VisitorResponse> getBySociety(Long societyId) {
        roleService.enforceSocietyScope(roleService.getCurrentUser(), societyId);
        return visitorRepository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getByFlat(Long flatId) {
        return visitorRepository.findByFlatId(flatId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getByStatus(String status) {
        return visitorRepository.findByStatus(status).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<VisitorResponse> getByType(String visitorType) {
        return visitorRepository.findByVisitorType(visitorType).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public VisitorResponse getById(Long id) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));
        roleService.enforceSocietyScope(roleService.getCurrentUser(), visitor.getSociety().getId());
        return toResponse(visitor);
    }

    @Override
    public VisitorResponse checkIn(Long id, Long userId) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));
        visitor.setCheckInTime(LocalDateTime.now());
        visitor.setStatus("CHECKED_IN");
        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public VisitorResponse checkOut(Long id, Long userId) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));
        visitor.setCheckOutTime(LocalDateTime.now());
        visitor.setStatus("CHECKED_OUT");
        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public VisitorResponse updateStatus(Long id, String status, Long userId) {
        Visitor visitor = visitorRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Visitor not found"));
        visitor.setStatus(status);
        if ("CHECKED_IN".equals(status) && visitor.getCheckInTime() == null) {
            visitor.setCheckInTime(LocalDateTime.now());
        }
        if ("CHECKED_OUT".equals(status) && visitor.getCheckOutTime() == null) {
            visitor.setCheckOutTime(LocalDateTime.now());
        }
        return toResponse(visitorRepository.save(visitor));
    }

    @Override
    public void delete(Long id) {
        if (!visitorRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Visitor not found");
        }
        visitorRepository.deleteById(id);
    }

    private VisitorResponse toResponse(Visitor visitor) {
        VisitorResponse response = new VisitorResponse();
        response.setId(visitor.getId());
        response.setVisitorName(visitor.getVisitorName());
        response.setVisitorPhone(visitor.getVisitorPhone());
        response.setVisitorType(visitor.getVisitorType());
        response.setPurpose(visitor.getPurpose());
        if (visitor.getFlat() != null) {
            response.setFlatId(visitor.getFlat().getId());
            response.setFlatNumber(visitor.getFlat().getFlatNumber());
        }
        response.setSocietyId(visitor.getSociety().getId());
        response.setSocietyName(visitor.getSociety().getName());
        response.setVehicleNumber(visitor.getVehicleNumber());
        response.setExpectedArrival(visitor.getExpectedArrival());
        response.setCheckInTime(visitor.getCheckInTime());
        response.setCheckOutTime(visitor.getCheckOutTime());
        response.setStatus(visitor.getStatus());
        response.setIsPreApproved(visitor.getIsPreApproved());
        response.setApprovalCode(visitor.getApprovalCode());
        if (visitor.getApprovedBy() != null) {
            response.setApprovedByName(visitor.getApprovedBy().getName());
        }
        response.setNotes(visitor.getNotes());
        response.setCreatedAt(visitor.getCreatedAt());
        return response;
    }
}
