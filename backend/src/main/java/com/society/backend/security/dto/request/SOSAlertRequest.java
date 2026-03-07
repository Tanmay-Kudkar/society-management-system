package com.society.backend.security.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SOSAlertRequest {

    @NotBlank(message = "Alert type is required")
    private String alertType;

    private String description;
    private Long flatId;
    private Long societyId;
    private String priority;
    private String location;
}
