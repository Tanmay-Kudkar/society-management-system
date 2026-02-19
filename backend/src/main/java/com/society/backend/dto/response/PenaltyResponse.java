package com.society.backend.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class PenaltyResponse {
    private Long id;
    private Long societyId;
    private Long issuedToId;
    private String issuedToName;
    private Long issuedById;
    private String issuedByName;
    private String flatNumber;
    private String wing;
    private String penaltyType;
    private String title;
    private String description;
    private BigDecimal amount;
    private LocalDate dueDate;
    private String paymentStatus;
    private BigDecimal paidAmount;
    private LocalDateTime paidAt;
    private String status;
    private String waivedReason;
    private String appealNotes;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
