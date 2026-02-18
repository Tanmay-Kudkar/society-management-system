package com.society.backend.dto.safety;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class GateLogRequest {

    @NotBlank(message = "Entry type is required")
    private String entryType;

    @NotBlank(message = "Person name is required")
    private String personName;

    private String personPhone;
    private String vehicleNumber;
    private Long flatId;
    private Long societyId;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String entryGate;
    private String exitGate;
    private String purpose;
    private String notes;
}
