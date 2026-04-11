package com.bicap.notification.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter 
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String body;

    // Quan trọng: Tên biến là isRead
    @Column(nullable = false)
    private boolean isRead = false; 

    private String type; 

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
    }
    public boolean getIsRead() {
        return isRead;
    }
}