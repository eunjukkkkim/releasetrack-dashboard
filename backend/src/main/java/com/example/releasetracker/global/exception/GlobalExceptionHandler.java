package com.example.releasetracker.global.exception;

import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(404, "Not Found", ex.getMessage()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(404, "Not Found", "요청한 리소스를 찾을 수 없습니다."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<FieldErrorResponse> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldErrorResponse)
                .toList();

        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(400, "Bad Request", "요청값이 올바르지 않습니다.", fieldErrors));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        // 컨트롤러/서비스에서 직접 던지는 사용자 친화적 메시지는 그대로 노출한다.
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(400, "Bad Request", ex.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        // Jackson 파싱 내부 메시지(클래스/필드 경로)가 클라이언트로 새어나가지 않도록 고정 메시지로 치환한다.
        log.warn("요청 본문 파싱 실패: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(400, "Bad Request", "요청 본문 형식이 올바르지 않습니다."));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameter(MissingServletRequestParameterException ex) {
        // 필수 쿼리 파라미터(@RequestParam required) 누락은 400 으로 매핑한다. 내부 원문 대신 고정 메시지로 치환한다.
        log.warn("필수 요청 파라미터 누락: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(400, "Bad Request", "필수 요청 파라미터가 누락되었습니다."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        // enum/날짜 등 타입 변환 실패의 Spring 내부 원문(허용 enum 값 나열 등) 노출을 막고 고정 메시지로 치환한다.
        log.warn("요청 파라미터 타입 변환 실패: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of(400, "Bad Request", "요청 파라미터 형식이 올바르지 않습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        // 그 외 모든 예외는 500 + 고정 메시지로 ErrorResponse 계약을 유지하고, 실제 원인은 서버 로그에만 남긴다.
        log.error("처리되지 않은 서버 오류", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of(500, "Internal Server Error", "서버 오류가 발생했습니다."));
    }

    private FieldErrorResponse toFieldErrorResponse(FieldError fieldError) {
        return new FieldErrorResponse(fieldError.getField(), fieldError.getDefaultMessage());
    }
}
