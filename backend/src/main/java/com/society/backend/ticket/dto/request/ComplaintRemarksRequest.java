package com.society.backend.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComplaintRemarksRequest {

    @NotBlank(message = "remarks is required")
    private String remarks;
}
