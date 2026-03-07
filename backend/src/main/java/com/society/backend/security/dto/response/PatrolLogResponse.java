package com.society.backend.security.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class PatrolLogResponse {
    private Long id;
    private Long societyId;
    private Long guardId;
    private String guardName;
    private Long checkpointId;
    private String checkpointName;
    private String checkpointLocation;
    private LocalDateTime scannedAt;
    private String status;
    private String notes;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime createdAt;
}
