package com.bicap.guest_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ArticleResponse {
    private String        id;
    private String        title;
    private String        content;
    private String        category;
    private String        imageUrl;
    private LocalDateTime publishedAt;
    private Integer       viewCount;
}