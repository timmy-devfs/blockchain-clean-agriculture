package com.bicap.notification.service;

import com.bicap.notification.model.Notification;
import com.bicap.notification.repository.NotificationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    // NotificationService.java
    public Page<Notification> getNotifications(String userId, Boolean isRead, Pageable pageable) {
        if (isRead != null) {
            return repository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, isRead, pageable);
        }
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public long getUnreadCount(String userId) {
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(String userId, Long id) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Ownership check
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("403 Forbidden: You do not own this notification");
        }
        
        notification.setIsRead(true);
        repository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        List<Notification> unread = repository.findByUserIdAndIsReadFalse(userId);
        unread.forEach(n -> n.setIsRead(true));
        repository.saveAll(unread);
    }

    @Transactional
    public void deleteNotification(String userId, Long id) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Ownership check
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("403 Forbidden");
        }
        
        repository.delete(notification);
    }
}