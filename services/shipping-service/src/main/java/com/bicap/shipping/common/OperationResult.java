package com.bicap.shipping.common;

import lombok.Getter;

@Getter
public final class OperationResult<T> {
    private final T data;
    private final ErrorCode errorCode;

    private OperationResult(T data, ErrorCode errorCode) {
        this.data = data;
        this.errorCode = errorCode;
    }

    public boolean isSuccess() {
        return errorCode == null;
    }

    public static <T> OperationResult<T> ok(T data) {
        return new OperationResult<>(data, null);
    }

    public static <T> OperationResult<T> fail(ErrorCode code) {
        return new OperationResult<>(null, code);
    }
}
