package com.bicap.guest.repository;

import com.bicap.guest.entity.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleRepository extends JpaRepository<Article, String> {

    // Chỉ lấy bài đã published
    Page<Article> findByIsPublishedTrue(Pageable pageable);

    // Filter theo category
    Page<Article> findByIsPublishedTrueAndCategory(String category, Pageable pageable);
}