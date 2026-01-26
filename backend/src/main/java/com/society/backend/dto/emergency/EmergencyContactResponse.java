package com.society.backend.dto.emergency;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class EmergencyContactResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String contactType;
    private String name;
    private String phone;
    private String alternatePhone;
    private String address;
    private String notes;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
