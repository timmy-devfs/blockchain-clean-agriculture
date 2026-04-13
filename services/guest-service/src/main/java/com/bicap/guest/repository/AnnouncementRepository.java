package com.bicap.guest.repository;

import com.bicap.guest.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, String> {

    /**
     * isActive=true VÀ now() nằm trong khoảng startAt - endAt
     */
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true " +
           "AND a.startAt <= :now AND a.endAt >= :now " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findActiveAnnouncements(LocalDateTime now);
}