package com.society.backend.notification.entity;

import com.society.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "notice_attendance",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_notice_attendance_notice_user", columnNames = {"notice_id", "user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
public class NoticeAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String status = "PRESENT"; // PRESENT, ABSENT

    @Column(name = "marked_at", nullable = false)
    private LocalDateTime markedAt;

    @PrePersist
    protected void onCreate() {
        if (markedAt == null) {
            markedAt = LocalDateTime.now();
        }
    }
}
