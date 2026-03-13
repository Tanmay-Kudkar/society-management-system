package com.society.backend.finance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookEventResponse {

    private Long id;
    private String eventId;
    private String eventType;
    private String processingStatus;
    private String processingDetails;
    private LocalDateTime receivedAt;
}
