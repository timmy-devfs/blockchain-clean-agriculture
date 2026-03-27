package com.bicap.identity_service.repository;

import com.bicap.identity_service.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
//import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailAndIsActiveTrue(String email);
    boolean existsByEmail(String email);
    Optional<User> findByIdAndIsActiveTrue(String id);
    Page<User> findByRole(User.Role role, Pageable pageable);
    Page<User> findByIsActive(Boolean isActive, Pageable pageable);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<User> searchUsers(String keyword, Pageable pageable);
}