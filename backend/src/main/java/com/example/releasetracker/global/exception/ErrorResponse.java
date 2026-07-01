package com.example.releasetracker.global.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        List<FieldErrorResponse> fieldErrors
) {

    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(LocalDateTime.now(), status, error, message, List.of());
    }

    public static ErrorResponse of(int status, String error, String message, List<FieldErrorResponse> fieldErrors) {
        return new ErrorResponse(LocalDateTime.now(), status, error, message, fieldErrors);
    }
}
