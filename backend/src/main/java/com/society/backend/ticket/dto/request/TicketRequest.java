package com.society.backend.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import com.society.backend.society.entity.Society;
import com.society.backend.ticket.entity.Complaint;
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

    private Integer progressPercent; // 0-100
}
