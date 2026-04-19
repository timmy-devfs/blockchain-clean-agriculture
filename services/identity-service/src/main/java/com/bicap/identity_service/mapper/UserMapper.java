package com.bicap.identity_service.mapper;

import com.bicap.identity_service.dto.response.UserResponse;
import com.bicap.identity_service.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper — compile-time safe
 * Entity → DTO: passwordHash tự động bị bỏ qua vì UserResponse không có field đó
 */
@Mapper(componentModel = "spring")
public interface UserMapper {

    // User entity → UserResponse DTO
    UserResponse toResponse(User user);

    // List<User> → List<UserResponse>
    List<UserResponse> toResponseList(List<User> users);
}