package com.society.backend.dto.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketRequest {
    @NotNull(message = "Society ID is required")
    private Long societyId;

    @NotBlank(message = "Type is required")
    private String type; // COMPLAINT, REQUEST, ISSUE, TASK

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String priority; // LOW, MEDIUM, HIGH, URGENT

    private Long assignedToId;
}
