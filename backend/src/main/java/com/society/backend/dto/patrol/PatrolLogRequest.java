package com.society.backend.dto.patrol;

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
