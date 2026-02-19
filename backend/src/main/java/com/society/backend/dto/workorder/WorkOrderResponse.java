package com.society.backend.dto.workorder;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class WorkOrderResponse {
    private Long id;
    private Long societyId;
    private String societyName;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private Long requestedById;
    private String requestedByName;
    private Long assignedToId;
    private String assignedToName;
    private Long flatId;
    private String flatNumber;
    private String location;
    private BigDecimal estimatedCost;
    private BigDecimal actualCost;
    private LocalDate scheduledDate;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private String notes;
    private String resolutionNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
