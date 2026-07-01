package com.example.releasetracker.domain.service.dto;

import com.example.releasetracker.domain.service.ServiceStatus;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record ServiceUpdateRequest(
        @Size(max = 500, message = "서비스 설명은 500자 이하로 입력해주세요.")
        String description,

        @URL(message = "저장소 URL 형식이 올바르지 않습니다.")
        @Size(max = 500, message = "저장소 URL은 500자 이하로 입력해주세요.")
        String repositoryUrl,

        ServiceStatus status
) {
}
