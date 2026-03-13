package com.society.backend.finance.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_webhook_events", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_webhook_event_id", columnNames = "event_id")
})
@Getter
@Setter
@NoArgsConstructor
public class PaymentWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, length = 128)
    private String eventId;

    @Column(name = "event_type", length = 80)
    private String eventType;

    @Column(name = "processing_status", length = 32)
    private String processingStatus;

    @Column(name = "processing_details", length = 255)
    private String processingDetails;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;

    @PrePersist
    protected void onCreate() {
        receivedAt = LocalDateTime.now();
        if (processingStatus == null) {
            processingStatus = "RECEIVED";
        }
    }
}
