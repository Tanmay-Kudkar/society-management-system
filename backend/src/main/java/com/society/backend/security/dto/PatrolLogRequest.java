package com.society.backend.security.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class PatrolLogRequest {

    private Long checkpointId;
    private Long societyId;
    private String notes;
    private BigDecimal latitude;
    private BigDecimal longitude;
}
