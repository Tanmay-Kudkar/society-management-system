package com.society.backend.ticket.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComplaintAssignRequest {

    @NotNull(message = "assignedToUserId is required")
    private Long assignedToUserId;
}
