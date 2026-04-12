// NotificationRepository.java
package com.bicap.notification.repository;

import com.bicap.notification.model.Notification;
import org.springframework.data.domain.Page; // Import đúng thư viện
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    Page<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(String userId, boolean isRead, Pageable pageable);

    long countByUserIdAndIsReadFalse(String userId);

    //List cho hàm này vì "Đọc tất cả" không cần phân trang
    java.util.List<Notification> findByUserIdAndIsReadFalse(String userId);
}