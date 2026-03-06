package com.society.backend.security.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class CheckpointResponse {
    private Long id;
    private Long societyId;
    private String checkpointName;
    private String location;
    private String description;
    private String qrCode;
    private int displayOrder;
    private boolean active;
    private LocalDateTime createdAt;
}
