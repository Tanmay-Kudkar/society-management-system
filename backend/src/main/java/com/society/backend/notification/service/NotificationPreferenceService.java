package com.society.backend.notification.service;

import com.society.backend.notification.dto.request.NotificationPreferenceRequest;
import com.society.backend.notification.dto.response.NotificationPreferenceResponse;
import com.society.backend.notification.entity.NotificationPreference;
import com.society.backend.user.entity.User;
import com.society.backend.common.exception.ApiException;
import com.society.backend.notification.repository.NotificationPreferenceRepository;
import com.society.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getByUserId(Long userId) {
        NotificationPreference pref = resolvePreference(userId);
        return mapToResponse(pref);
    }

    @Transactional
    public NotificationPreferenceResponse update(Long userId, NotificationPreferenceRequest request) {
        NotificationPreference pref = resolvePreference(userId);

        if (request.getEmailTickets() != null) {
            pref.setEmailTickets(request.getEmailTickets());
        }
        if (request.getEmailComplaints() != null) {
            pref.setEmailComplaints(request.getEmailComplaints());
        }
        if (request.getEmailPayments() != null) {
            pref.setEmailPayments(request.getEmailPayments());
        }
        if (request.getEmailContracts() != null) {
            pref.setEmailContracts(request.getEmailContracts());
        }
        if (request.getEmailTenants() != null) {
            pref.setEmailTenants(request.getEmailTenants());
        }
        if (request.getEmailNotices() != null) {
            pref.setEmailNotices(request.getEmailNotices());
        }

        NotificationPreference saved = preferenceRepository.save(pref);
        return mapToResponse(saved);
    }

    private NotificationPreference resolvePreference(Long userId) {
        List<NotificationPreference> prefs = preferenceRepository.findAllByUserIdOrderByIdDesc(userId);
        if (!prefs.isEmpty()) {
            return prefs.get(0);
        }
        return createDefaultPreferences(userId);
    }

    private NotificationPreference createDefaultPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        NotificationPreference pref = new NotificationPreference(user);
        pref.setSociety(user.getSociety());
        return preferenceRepository.save(pref);
    }

    private NotificationPreferenceResponse mapToResponse(NotificationPreference pref) {
        return NotificationPreferenceResponse.builder()
                .id(pref.getId())
                .userId(pref.getUser().getId())
                .emailTickets(pref.getEmailTickets())
                .emailComplaints(pref.getEmailComplaints())
                .emailPayments(pref.getEmailPayments())
                .emailContracts(pref.getEmailContracts())
                .emailTenants(pref.getEmailTenants())
                .emailNotices(pref.getEmailNotices())
                .build();
    }

    // Helper methods for checking preferences before sending emails
    public boolean shouldSendTicketEmail(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(NotificationPreference::getEmailTickets)
                .orElse(true);
    }

    public boolean shouldSendComplaintEmail(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(NotificationPreference::getEmailComplaints)
                .orElse(true);
    }

    public boolean shouldSendPaymentEmail(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(NotificationPreference::getEmailPayments)
                .orElse(true);
    }

    public boolean shouldSendContractEmail(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(NotificationPreference::getEmailContracts)
                .orElse(true);
    }

    public boolean shouldSendTenantEmail(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(NotificationPreference::getEmailTenants)
                .orElse(true);
    }

    public boolean shouldSendNoticeEmail(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(NotificationPreference::getEmailNotices)
                .orElse(true);
    }
}
