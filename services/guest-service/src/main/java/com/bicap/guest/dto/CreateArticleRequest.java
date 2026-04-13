package com.bicap.guest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateArticleRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 500)
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String category;
    private String imageUrl;
}