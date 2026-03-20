package com.society.backend.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ComplaintCommentRequest {

    @NotBlank(message = "Comment is required")
    @Size(max = 1500, message = "Comment cannot exceed 1500 characters")
    private String message;
}
