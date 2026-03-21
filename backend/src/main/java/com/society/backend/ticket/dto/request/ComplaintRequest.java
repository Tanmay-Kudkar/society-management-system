package com.society.backend.ticket.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ComplaintRequest {

    private Long societyId;

    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject cannot exceed 200 characters")
    private String subject;

    @NotBlank(message = "Description is required")
    private String description;

    private String category;

    private String priority;

    private String wing;

    private Integer floor;

    private String flatNumber;

    private String locationDetails;

    private Long assignedToUserId;

    private Long raisedForUserId;

    private String raisedForReason;

    private String adminRemarks;

    private List<String> attachmentUrls;
}
