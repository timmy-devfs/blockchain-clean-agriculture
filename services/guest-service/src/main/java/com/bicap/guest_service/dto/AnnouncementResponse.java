package com.bicap.guest_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AnnouncementResponse {
    private String        id;
    private String        title;
    private String        content;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
}