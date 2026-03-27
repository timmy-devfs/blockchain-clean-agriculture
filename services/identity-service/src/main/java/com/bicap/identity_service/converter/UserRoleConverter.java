package com.bicap.identity_service.converter;

import com.bicap.identity_service.entity.User;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class UserRoleConverter implements AttributeConverter<User.Role, Integer> {

    @Override
    public Integer convertToDatabaseColumn(User.Role attribute) {
        if (attribute == null) {
            return null;
        }

        // Match V1__create_roles.sql insert order (AUTO_INCREMENT starts at 1)
        return switch (attribute) {
            case ADMIN -> 1;
            case FARM_MANAGER -> 2;
            case RETAILER -> 3;
            case SHIPPER -> 4;
        };
    }

    @Override
    public User.Role convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }

        return switch (dbData) {
            case 1 -> User.Role.ADMIN;
            case 2 -> User.Role.FARM_MANAGER;
            case 3 -> User.Role.RETAILER;
            case 4 -> User.Role.SHIPPER;
            default -> throw new IllegalArgumentException("Unknown role_id: " + dbData);
        };
    }
}

