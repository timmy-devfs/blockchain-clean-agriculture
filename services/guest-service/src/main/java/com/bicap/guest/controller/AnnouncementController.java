package com.bicap.guest.controller;

import com.bicap.guest.dto.AnnouncementResponse;
import com.bicap.guest.dto.ApiResponse;
import com.bicap.guest.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;

    /**
     * GET /api/public/announcements
     * Chỉ trả về isActive=true AND now() BETWEEN startAt AND endAt
     */
    @GetMapping
    public ApiResponse<List<AnnouncementResponse>> getAnnouncements() {
        LocalDateTime now = LocalDateTime.now();
        List<AnnouncementResponse> list = announcementRepository
                .findActiveAnnouncements(now)
                .stream()
                .map(a -> AnnouncementResponse.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .content(a.getContent())
                        .startAt(a.getStartAt())
                        .endAt(a.getEndAt())
                        .build())
                .collect(Collectors.toList());

        return ApiResponse.success(list);
    }
}