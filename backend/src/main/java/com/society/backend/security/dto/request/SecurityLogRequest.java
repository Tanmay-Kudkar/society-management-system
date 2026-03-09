package com.society.backend.security.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SecurityLogRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Event description is required")
    private String event;

    @NotBlank(message = "Log type is required")
    private String type;

    @NotBlank(message = "Status is required")
    private String status;
}
