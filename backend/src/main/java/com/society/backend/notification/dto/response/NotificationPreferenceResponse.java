package com.society.backend.notification.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class NotificationPreferenceResponse {
    private Long id;
    private Long userId;
    private Boolean emailTickets;
    private Boolean emailComplaints;
    private Boolean emailPayments;
    private Boolean emailContracts;
    private Boolean emailTenants;
    private Boolean emailNotices;
}
