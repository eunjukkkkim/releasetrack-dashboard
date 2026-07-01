package com.example.releasetracker.domain.service.dto;

import com.example.releasetracker.domain.service.ServiceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

public record ServiceCreateRequest(
        @NotBlank(message = "서비스명은 필수입니다.")
        @Size(max = 100, message = "서비스명은 100자 이하로 입력해주세요.")
        String name,

        @Size(max = 500, message = "서비스 설명은 500자 이하로 입력해주세요.")
        String description,

        @Size(max = 100, message = "담당자는 100자 이하로 입력해주세요.")
        String owner,

        @URL(message = "저장소 URL 형식이 올바르지 않습니다.")
        @Size(max = 500, message = "저장소 URL은 500자 이하로 입력해주세요.")
        String repositoryUrl,

        @NotNull(message = "서비스 상태는 필수입니다.")
        ServiceStatus status
) {
}
