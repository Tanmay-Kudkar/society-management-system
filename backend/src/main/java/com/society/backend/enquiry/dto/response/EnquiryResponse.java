package com.society.backend.enquiry.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class EnquiryResponse {
    private Long id;
    private String name;
    private String phone;
    private String reason;
    private LocalDateTime submittedAt;
}
