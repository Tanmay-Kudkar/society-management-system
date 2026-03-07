package com.society.backend.finance.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.society.backend.finance.entity.Penalty;
import com.society.backend.flat.entity.Wing;
import com.society.backend.society.entity.Society;
import com.society.backend.user.entity.User;
@Getter
@Setter
public class PenaltyRequest {

    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotNull(message = "Issued To user ID is required")
    private Long issuedToId;

    private String flatNumber;
    private String wing;

    @NotBlank(message = "Penalty type is required")
    private String penaltyType;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    private LocalDate dueDate;
    private String adminNotes;
}
