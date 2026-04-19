package com.bicap.guest_service.controller;

import com.bicap.guest_service.dto.*;
import com.bicap.guest_service.entity.Article;
import com.bicap.guest_service.repository.ArticleRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/articles")
@RequiredArgsConstructor
@Slf4j
public class ArticleController {

    private final ArticleRepository articleRepository;

    /**
     * GET /api/public/articles — public, không cần JWT
     */
    @GetMapping
    public ApiResponse<List<ArticleResponse>> getArticles(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category) {

        Pageable pageable = PageRequest.of(page, size,
                Sort.by("publishedAt").descending());

        Page<Article> articlePage = category != null
                ? articleRepository.findByIsPublishedTrueAndCategory(category, pageable)
                : articleRepository.findByIsPublishedTrue(pageable);

        List<ArticleResponse> content = articlePage.getContent()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ApiResponse.success(content);
    }

    /**
     * GET /api/public/articles/{id} — public + tăng viewCount
     */
    @GetMapping("/{id}")
    public ApiResponse<ArticleResponse> getArticle(@PathVariable String id) {
        Article article = articleRepository.findById(id)
                .filter(Article::getIsPublished)
                .orElseThrow(() -> new org.springframework.web.server
                        .ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Bài viết không tồn tại"));

        // Tăng viewCount
        article.setViewCount(article.getViewCount() + 1);
        articleRepository.save(article);

        return ApiResponse.success(toResponse(article));
    }

    /**
     * POST /api/public/articles — Admin only
     * Gateway forward X-User-Role nếu user đã đăng nhập
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ArticleResponse> createArticle(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @RequestHeader(value = "X-User-Id",   required = false) String authorId,
            @Valid @RequestBody CreateArticleRequest request) {

        if (!"ADMIN".equalsIgnoreCase(callerRole)) {
            return ApiResponse.error(403, "Only Admin can create articles");
        }

        Article article = Article.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .authorId(authorId)
                .isPublished(true)
                .build();

        Article saved = articleRepository.save(article);
        log.info("[ARTICLE] Created by Admin {}: {}", authorId, saved.getTitle());
        return ApiResponse.<ArticleResponse>builder()
                .code(201).message("Article created").data(toResponse(saved)).build();
    }

    private ArticleResponse toResponse(Article a) {
        return ArticleResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .category(a.getCategory())
                .imageUrl(a.getImageUrl())
                .publishedAt(a.getPublishedAt())
                .viewCount(a.getViewCount())
                .build();
    }
}