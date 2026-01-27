package com.society.backend.dto.notification;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationPreferenceRequest {
    private Boolean emailTickets;
    private Boolean emailComplaints;
    private Boolean emailPayments;
    private Boolean emailContracts;
    private Boolean emailTenants;
    private Boolean emailNotices;
}
