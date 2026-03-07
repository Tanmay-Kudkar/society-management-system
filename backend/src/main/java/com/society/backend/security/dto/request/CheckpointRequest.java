package com.society.backend.security.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CheckpointRequest {

    @NotBlank(message = "Checkpoint name is required")
    private String checkpointName;

    private String location;
    private String description;
    private String qrCode;
    private Long societyId;
    private Integer displayOrder;
}
