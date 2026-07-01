package com.example.releasetracker;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class ApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getServicesReturnsSampleServices() throws Exception {
        mockMvc.perform(get("/api/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(12)))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].lastDeploymentVersion").exists());
    }

    @Test
    void createServiceReturnsCreated() throws Exception {
        String body = """
                {
                  "name": "admin-web",
                  "description": "관리자 웹 서비스",
                  "owner": "frontend-team",
                  "repositoryUrl": "https://github.com/example/admin-web",
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/services/13"))
                .andExpect(jsonPath("$.id").value(13))
                .andExpect(jsonPath("$.name").value("admin-web"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createServiceWithInvalidRequestReturnsBadRequest() throws Exception {
        String body = """
                {
                  "name": "",
                  "repositoryUrl": "not-a-url",
                  "status": null
                }
                """;

        mockMvc.perform(post("/api/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void getServiceReturnsNotFoundWhenMissing() throws Exception {
        mockMvc.perform(get("/api/services/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateServiceReturnsUpdatedService() throws Exception {
        // 수정 경로는 description/repositoryUrl/status 만 편집한다. name/owner 는 요청에 실려도(계약상 미포함)
        // 편집 대상이 아니므로 원래 값(customer-web / frontend-team)이 유지되어야 한다.
        String body = """
                {
                  "description": "고객용 웹 프론트엔드 서비스",
                  "repositoryUrl": "https://github.com/example/customer-web-v2",
                  "status": "MAINTENANCE"
                }
                """;

        mockMvc.perform(patch("/api/services/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.description").value("고객용 웹 프론트엔드 서비스"))
                .andExpect(jsonPath("$.repositoryUrl").value("https://github.com/example/customer-web-v2"))
                .andExpect(jsonPath("$.status").value("MAINTENANCE"))
                // 수정 경로가 name/owner 를 건드리지 않는지(원래 값 유지) 단언.
                .andExpect(jsonPath("$.name").value("customer-web"))
                .andExpect(jsonPath("$.owner").value("frontend-team"));
    }

    @Test
    void deleteServiceWithoutDeploymentsReturnsNoContent() throws Exception {
        String body = """
                {
                  "name": "temporary-service",
                  "description": "삭제 테스트 서비스",
                  "owner": "qa-team",
                  "repositoryUrl": "https://github.com/example/temporary-service",
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(13));

        mockMvc.perform(delete("/api/services/13"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/services/13"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteServiceWithDeploymentsReturnsBadRequest() throws Exception {
        mockMvc.perform(delete("/api/services/1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("배포 이력이 있는 서비스는 삭제할 수 없습니다. 아카이브를 사용하세요. serviceId=1"));
    }

    @Test
    void getDeploymentsReturnsFilteredDeployments() throws Exception {
        mockMvc.perform(get("/api/deployments")
                        .param("environment", "PRODUCTION")
                        .param("status", "SUCCESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(12)))
                .andExpect(jsonPath("$.totalElements").value(12))
                .andExpect(jsonPath("$.content[0].serviceName").exists())
                .andExpect(jsonPath("$.content[0].changes").doesNotExist());
    }

    @Test
    void getDeploymentsReturnsDefaultPage() throws Exception {
        mockMvc.perform(get("/api/deployments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(20)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.totalElements").value(36))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(false));
    }

    @Test
    void getDeploymentsFirstPageHasMorePages() throws Exception {
        mockMvc.perform(get("/api/deployments")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.totalElements").value(36))
                .andExpect(jsonPath("$.totalPages").value(4))
                .andExpect(jsonPath("$.first").value(true))
                .andExpect(jsonPath("$.last").value(false));
    }

    @Test
    void getDeploymentsLastPageReturnsRemainder() throws Exception {
        // 총 36건, size=10 → 페이지 0,1,2,3. 마지막 페이지(index 3)는 나머지 6건.
        mockMvc.perform(get("/api/deployments")
                        .param("page", "3")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(6)))
                .andExpect(jsonPath("$.page").value(3))
                .andExpect(jsonPath("$.first").value(false))
                .andExpect(jsonPath("$.last").value(true));
    }

    @Test
    void getDeploymentsCombinesServiceIdAndStatusFilters() throws Exception {
        mockMvc.perform(get("/api/deployments")
                        .param("serviceId", "1")
                        .param("status", "SUCCESS"))
                .andExpect(status().isOk())
                // customer-web SUCCESS: id1(PROD),7(DEV),27(PROD),28(STAGING),29(DEV) = 5건.
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.content[0].serviceId").value(1));
    }

    @Test
    void getDeploymentsAppliesFromDateFilter() throws Exception {
        mockMvc.perform(get("/api/deployments")
                        .param("serviceId", "2")
                        .param("from", "2000-01-01"))
                .andExpect(status().isOk())
                // admin-api 전체: id2(DEV),10(PROD),13(STAGING),15(DEV),19(PROD) = 5건.
                .andExpect(jsonPath("$.content", hasSize(5)))
                .andExpect(jsonPath("$.totalElements").value(5));
    }

    @Test
    void getDeploymentsWithToBeforeAllReturnsEmptyContent() throws Exception {
        mockMvc.perform(get("/api/deployments")
                        .param("to", "2000-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void getDeploymentsWithInvalidSizeReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/deployments").param("size", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        mockMvc.perform(get("/api/deployments").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        mockMvc.perform(get("/api/deployments").param("page", "-1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getDeploymentsWithUnknownEnumReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/deployments").param("status", "BOGUS"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("요청 파라미터 형식이 올바르지 않습니다."));
    }

    @Test
    void createDeploymentReturnsCreated() throws Exception {
        String body = """
                {
                  "serviceId": 1,
                  "version": "v1.2.6",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "mason",
                  "deployedAt": "2026-06-28T15:00:00",
                  "startedAt": "2026-06-28T15:00:00",
                  "finishedAt": "2026-06-28T15:05:00",
                  "commit": "abc1230000000000000000000000000000000000",
                  "branch": "main",
                  "summary": "주문 내역 화면 개선",
                  "failureReason": null,
                  "rollbacked": false,
                  "changes": [
                    {
                      "changeType": "FEATURE",
                      "description": "주문 내역 필터 기능 추가"
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/deployments/37"))
                .andExpect(jsonPath("$.id").value(37))
                .andExpect(jsonPath("$.serviceId").value(1))
                .andExpect(jsonPath("$.branch").value("main"))
                .andExpect(jsonPath("$.commit").value("abc1230000000000000000000000000000000000"))
                // durationSec = finishedAt - startedAt = 5분 = 300초 (응답 파생값)
                .andExpect(jsonPath("$.durationSec").value(300))
                .andExpect(jsonPath("$.changes", hasSize(1)));
    }

    @Test
    void createDeploymentWithMissingServiceReturnsNotFound() throws Exception {
        String body = """
                {
                  "serviceId": 9999,
                  "version": "v1.0.0",
                  "environment": "DEV",
                  "status": "SUCCESS",
                  "deployedBy": "mason",
                  "deployedAt": "2026-06-28T15:00:00"
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void archiveServiceTransitionReflectedInGet() throws Exception {
        String body = """
                {
                  "status": "ARCHIVED"
                }
                """;

        mockMvc.perform(patch("/api/services/6")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));

        mockMvc.perform(get("/api/services/6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    @Test
    void createDeploymentOnArchivedServiceReturnsBadRequest() throws Exception {
        // 시드상 serviceId=6(legacy-report)은 ARCHIVED 상태이므로 신규 배포 생성이 차단된다.
        String body = """
                {
                  "serviceId": 6,
                  "version": "v0.6.0",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "dana",
                  "deployedAt": "2026-06-28T15:00:00"
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("아카이브된 서비스에는 새 배포를 등록할 수 없습니다. serviceId=6"))
                .andExpect(jsonPath("$.fieldErrors", hasSize(0)));
    }

    @Test
    void createDeploymentAfterRestoringArchivedServiceReturnsCreated() throws Exception {
        // ARCHIVED → ACTIVE 복원 후 동일 서비스에 배포가 정상 생성되는지(회귀) 검증.
        String restore = """
                {
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(patch("/api/services/6")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(restore))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        String deployment = """
                {
                  "serviceId": 6,
                  "version": "v0.6.0",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "dana",
                  "deployedAt": "2026-06-28T15:00:00"
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deployment))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.serviceId").value(6));
    }

    @Test
    void getDeploymentReturnsDetailWithChanges() throws Exception {
        mockMvc.perform(get("/api/deployments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.serviceName").value("customer-web"))
                .andExpect(jsonPath("$.changes", hasSize(2)));
    }

    @Test
    void updateDeploymentReturnsUpdatedDeployment() throws Exception {
        String body = """
                {
                  "status": "FAILED",
                  "failureReason": "배포 후 API 응답 오류 확인",
                  "rollbacked": true
                }
                """;

        mockMvc.perform(patch("/api/deployments/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.status").value("FAILED"))
                .andExpect(jsonPath("$.rollbacked").value(true));
    }

    @Test
    void deleteDeploymentReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/deployments/4"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/deployments/4"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getServicesFilteredByStatus() throws Exception {
        mockMvc.perform(get("/api/services").param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)));
    }

    @Test
    void getServicesFilteredByKeyword() throws Exception {
        // "api" 포함: admin-api, notification-api, order-api, search-api = 4건.
        mockMvc.perform(get("/api/services").param("keyword", "api"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(4)));
    }

    @Test
    void getServicesFilteredByStatusAndKeyword() throws Exception {
        mockMvc.perform(get("/api/services")
                        .param("status", "ACTIVE")
                        .param("keyword", "api"))
                .andExpect(status().isOk())
                // 4개 api 서비스 모두 ACTIVE.
                .andExpect(jsonPath("$", hasSize(4)));
    }

    @Test
    void updateServiceReturnsNotFoundWhenMissing() throws Exception {
        String body = """
                {
                  "status": "MAINTENANCE"
                }
                """;

        mockMvc.perform(patch("/api/services/9999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void updateDeploymentReturnsNotFoundWhenMissing() throws Exception {
        String body = """
                {
                  "status": "SUCCESS"
                }
                """;

        mockMvc.perform(patch("/api/deployments/9999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void createDeploymentWithMissingRequiredFieldsReturnsBadRequest() throws Exception {
        String body = """
                {
                  "summary": "필수 필드 누락"
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void createDeploymentWithInvalidNestedChangeReturnsBadRequest() throws Exception {
        String body = """
                {
                  "serviceId": 1,
                  "version": "v1.2.5",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "mason",
                  "deployedAt": "2026-06-28T15:00:00",
                  "changes": [
                    {
                      "changeType": "FEATURE",
                      "description": ""
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    void createDeploymentWithMalformedBodyReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ not-json }"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("요청 본문 형식이 올바르지 않습니다."));
    }

    @Test
    void deploymentsWithEqualDeployedAtAreOrderedDeterministicallyByIdDesc() throws Exception {
        // 같은 serviceId 에 동일한 deployedAt 을 가진 두 배포를 생성해 deployedAt 동률 상황을 만든다.
        // 시드(36건) 다음 id 이므로 먼저 생성=37, 나중 생성=38. 미래 시각이라 두 건이 항상 최신이다.
        String tieA = """
                {
                  "serviceId": 1,
                  "version": "tie-a",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "tester",
                  "deployedAt": "2099-01-01T00:00:00"
                }
                """;
        String tieB = """
                {
                  "serviceId": 1,
                  "version": "tie-b",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "tester",
                  "deployedAt": "2099-01-01T00:00:00"
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tieA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(37));
        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tieB))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(38));

        // 페이지네이션 검색: 동률이어도 id desc 로 결정적 정렬 → 38(tie-b)이 37(tie-a)보다 먼저.
        mockMvc.perform(get("/api/deployments")
                        .param("serviceId", "1")
                        .param("from", "2099-01-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].id").value(38))
                .andExpect(jsonPath("$.content[0].version").value("tie-b"))
                .andExpect(jsonPath("$.content[1].id").value(37))
                .andExpect(jsonPath("$.content[1].version").value("tie-a"));

        // 단건 상세(findFirst 경로)와 목록(맵 경로)이 동률 시 동일한 lastDeployment(=id 38, tie-b)를 가리킨다.
        mockMvc.perform(get("/api/services/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastDeploymentVersion").value("tie-b"));
        mockMvc.perform(get("/api/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == 1)].lastDeploymentVersion", hasItem("tie-b")));
    }

    @Test
    void getDashboardSummaryReturnsCountsAndRecentDeployments() throws Exception {
        String summaryResponse = mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalServiceCount").value(12))
                .andExpect(jsonPath("$.activeServiceCount").value(10))
                // 윈도우(최근 7일) 18건: SUCCESS 10, FAILED 2, ROLLED_BACK 1, RUNNING 3, QUEUED 2.
                .andExpect(jsonPath("$.weeklyDeploymentCount").value(18))
                .andExpect(jsonPath("$.productionDeploymentCount").value(7))
                .andExpect(jsonPath("$.successDeploymentCount").value(10))
                .andExpect(jsonPath("$.failedDeploymentCount").value(2))
                .andExpect(jsonPath("$.rollbackCount").value(1))
                // successRate 분모 = 터미널(SUCCESS+FAILED+ROLLED_BACK)=13. 10/13 = 76.9 (in-flight 5건 제외).
                .andExpect(jsonPath("$.successRate").value(76.9))
                // 추이: 상태별 누적막대. series 는 항상 ["SUCCESS","FAILED","RUNNING"] 3개 고정.
                .andExpect(jsonPath("$.deploymentTrendByStatus.series", hasSize(3)))
                .andExpect(jsonPath("$.deploymentTrendByStatus.series[0]").value("SUCCESS"))
                .andExpect(jsonPath("$.deploymentTrendByStatus.series[1]").value("FAILED"))
                .andExpect(jsonPath("$.deploymentTrendByStatus.series[2]").value("RUNNING"))
                // points: 7일 0채움. 모든 포인트가 date + 3버킷 키를 빠짐없이 가진다.
                .andExpect(jsonPath("$.deploymentTrendByStatus.points", hasSize(7)))
                .andExpect(jsonPath("$.deploymentTrendByStatus.points[0].date").exists())
                .andExpect(jsonPath("$.deploymentTrendByStatus.points[0].SUCCESS").exists())
                .andExpect(jsonPath("$.deploymentTrendByStatus.points[0].FAILED").exists())
                .andExpect(jsonPath("$.deploymentTrendByStatus.points[0].RUNNING").exists())
                // statusStats: 5개 상태(QUEUED/RUNNING/SUCCESS/FAILED/ROLLED_BACK) 0 포함 전수.
                .andExpect(jsonPath("$.statusStats", hasSize(5)))
                // recentFailedDeployments: 전기간 FAILED+ROLLED_BACK = deployedAt desc 기준 id8,11,17,19,25 = 5건(상위 5).
                .andExpect(jsonPath("$.recentFailedDeployments", hasSize(5)))
                .andExpect(jsonPath("$.serviceDeploymentStatuses", hasSize(12)))
                // 경과일 병합(기존 stale 단언과 동치): stale = 이력 없는 billing-cron(null)
                // + 22일 미배포 legacy-report(>=14). 배포 서비스는 정수 경과일.
                .andExpect(jsonPath(
                        "$.serviceDeploymentStatuses[?(@.serviceName=='billing-cron')].daysSinceLastDeployment[0]")
                        .doesNotExist())
                .andExpect(jsonPath(
                        "$.serviceDeploymentStatuses[?(@.serviceName=='billing-cron')].lastDeployedAt[0]")
                        .doesNotExist())
                .andExpect(jsonPath(
                        "$.serviceDeploymentStatuses[?(@.serviceName=='legacy-report')].daysSinceLastDeployment")
                        .value(hasItem(22)))
                .andExpect(jsonPath(
                        "$.serviceDeploymentStatuses[?(@.serviceName=='customer-web')].daysSinceLastDeployment")
                        .value(hasItem(0)))
                .andExpect(jsonPath("$.recentDeployments", hasSize(10)))
                // topDeployedServices: 전기간 배포 수 desc, 이름 asc. 상위 5는 모두 서로 다른 건수(결정적).
                .andExpect(jsonPath("$.topDeployedServices", hasSize(5)))
                // 상태 그룹 규칙: 성공=SUCCESS, 실패=FAILED+ROLLED_BACK, 진행중=RUNNING+QUEUED.
                // 불변식: deploymentCount == successCount + failedCount + inProgressCount (전기간 동일 모집단).
                // [0] customer-web: 전기간 ids 1,5,7,8,27,28,29 → SUCCESS5(1,7,27,28,29)/FAILED1(8)/QUEUED1(5).
                .andExpect(jsonPath("$.topDeployedServices[0].serviceId").value(1))
                .andExpect(jsonPath("$.topDeployedServices[0].serviceName").value("customer-web"))
                .andExpect(jsonPath("$.topDeployedServices[0].deploymentCount").value(7))
                .andExpect(jsonPath("$.topDeployedServices[0].successCount").value(5))
                .andExpect(jsonPath("$.topDeployedServices[0].failedCount").value(1))
                .andExpect(jsonPath("$.topDeployedServices[0].inProgressCount").value(1))
                // [1] order-api: ids 3,11,12,20,25,30 → SUCCESS3(12,20,30)/FAILED+ROLLED_BACK2(25,11)/RUNNING1(3).
                .andExpect(jsonPath("$.topDeployedServices[1].serviceId").value(4))
                .andExpect(jsonPath("$.topDeployedServices[1].serviceName").value("order-api"))
                .andExpect(jsonPath("$.topDeployedServices[1].deploymentCount").value(6))
                .andExpect(jsonPath("$.topDeployedServices[1].successCount").value(3))
                .andExpect(jsonPath("$.topDeployedServices[1].failedCount").value(2))
                .andExpect(jsonPath("$.topDeployedServices[1].inProgressCount").value(1))
                // [2] admin-api: ids 2,10,13,15,19 → SUCCESS3(10,13,15)/ROLLED_BACK1(19)/RUNNING1(2).
                .andExpect(jsonPath("$.topDeployedServices[2].serviceId").value(2))
                .andExpect(jsonPath("$.topDeployedServices[2].serviceName").value("admin-api"))
                .andExpect(jsonPath("$.topDeployedServices[2].deploymentCount").value(5))
                .andExpect(jsonPath("$.topDeployedServices[2].successCount").value(3))
                .andExpect(jsonPath("$.topDeployedServices[2].failedCount").value(1))
                .andExpect(jsonPath("$.topDeployedServices[2].inProgressCount").value(1))
                // [3] inventory-batch: ids 4,14,31,32 → SUCCESS3(14,31,32)/실패0/RUNNING1(4).
                .andExpect(jsonPath("$.topDeployedServices[3].serviceName").value("inventory-batch"))
                .andExpect(jsonPath("$.topDeployedServices[3].deploymentCount").value(4))
                .andExpect(jsonPath("$.topDeployedServices[3].successCount").value(3))
                .andExpect(jsonPath("$.topDeployedServices[3].failedCount").value(0))
                .andExpect(jsonPath("$.topDeployedServices[3].inProgressCount").value(1))
                // [4] notification-api: ids 6,17,33 → SUCCESS1(33)/FAILED1(17)/QUEUED1(6).
                .andExpect(jsonPath("$.topDeployedServices[4].serviceName").value("notification-api"))
                .andExpect(jsonPath("$.topDeployedServices[4].deploymentCount").value(3))
                .andExpect(jsonPath("$.topDeployedServices[4].successCount").value(1))
                .andExpect(jsonPath("$.topDeployedServices[4].failedCount").value(1))
                .andExpect(jsonPath("$.topDeployedServices[4].inProgressCount").value(1))
                .andReturn().getResponse().getContentAsString();

        // 버킷 합산 정확성(7일 윈도우): SUCCESS=10, FAILED=FAILED2+ROLLED_BACK1=3, RUNNING=RUNNING3+QUEUED2=5.
        // 7개 포인트에 걸친 시리즈별 일별 값의 합이 위 버킷 총계와 정확히 일치한다.
        com.fasterxml.jackson.databind.JsonNode summary =
                new com.fasterxml.jackson.databind.ObjectMapper().readTree(summaryResponse);
        com.fasterxml.jackson.databind.JsonNode statusTrend = summary.get("deploymentTrendByStatus");
        long successTotal = 0;
        long failedTotal = 0;
        long runningTotal = 0;
        for (com.fasterxml.jackson.databind.JsonNode point : statusTrend.get("points")) {
            successTotal += point.get("SUCCESS").asLong();
            failedTotal += point.get("FAILED").asLong();
            runningTotal += point.get("RUNNING").asLong();
        }
        org.junit.jupiter.api.Assertions.assertEquals(10L, successTotal, "SUCCESS 버킷 7일 합");
        org.junit.jupiter.api.Assertions.assertEquals(3L, failedTotal, "FAILED 버킷(FAILED+ROLLED_BACK) 7일 합");
        org.junit.jupiter.api.Assertions.assertEquals(5L, runningTotal, "RUNNING 버킷(RUNNING+QUEUED) 7일 합");
        // 차트 총합이 KPI weeklyDeploymentCount(18) 와 일치(상태 버킷이 윈도우 모집단을 빠짐없이 분할).
        org.junit.jupiter.api.Assertions.assertEquals(
                summary.get("weeklyDeploymentCount").asLong(), successTotal + failedTotal + runningTotal);

        // topDeployedServices 각 행 불변식: deploymentCount == success + failed + inProgress.
        // (5종 상태가 3버킷으로 빠짐·중복 없이 분할되므로 세 합 = 전체.)
        for (com.fasterxml.jackson.databind.JsonNode row : summary.get("topDeployedServices")) {
            long deploymentCount = row.get("deploymentCount").asLong();
            long bucketSum = row.get("successCount").asLong()
                    + row.get("failedCount").asLong()
                    + row.get("inProgressCount").asLong();
            org.junit.jupiter.api.Assertions.assertEquals(
                    deploymentCount, bucketSum,
                    "top5 불변식 위반: " + row.get("serviceName").asText());
        }
    }

    @Test
    void getDashboardSummaryReturnsEnvironmentTrendAndStatusStats() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                // 제거된 필드는 더 이상 응답에 존재하지 않는다.
                .andExpect(jsonPath("$.environmentStats").doesNotExist())
                .andExpect(jsonPath("$.environmentPipelines").doesNotExist())
                .andExpect(jsonPath("$.environmentDurations").doesNotExist())
                // 멀티라인 추이(서비스별·환경별)는 상태별 누적막대로 대체되어 더 이상 존재하지 않는다.
                .andExpect(jsonPath("$.deploymentTrend").doesNotExist())
                .andExpect(jsonPath("$.deploymentTrendByEnvironment").doesNotExist())
                // staleServices 는 serviceDeploymentStatuses 의 경과일 컬럼으로 병합되어 제거되었다.
                .andExpect(jsonPath("$.staleServices").doesNotExist())
                // 환경별 상태분포: 항상 3환경 고정 순서, 각 statusStats 5상태 0채움.
                .andExpect(jsonPath("$.statusStatsByEnvironment", hasSize(3)))
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].environment").value("DEV"))
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].statusStats", hasSize(5)))
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].statusStats[0].status").value("QUEUED"))
                .andExpect(jsonPath("$.statusStatsByEnvironment[1].environment").value("STAGING"))
                .andExpect(jsonPath("$.statusStatsByEnvironment[1].statusStats", hasSize(5)))
                .andExpect(jsonPath("$.statusStatsByEnvironment[2].environment").value("PRODUCTION"))
                .andExpect(jsonPath("$.statusStatsByEnvironment[2].statusStats", hasSize(5)))
                // DEV 윈도우(7일) 상태: QUEUED2(id5,id6)/RUNNING1(id2)/SUCCESS3(id7,id12,id15)/FAILED0/ROLLED_BACK0.
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].statusStats[0].count").value(2))
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].statusStats[1].count").value(1))
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].statusStats[2].count").value(3))
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].statusStats[3].count").value(0))
                .andExpect(jsonPath("$.statusStatsByEnvironment[0].statusStats[4].count").value(0))
                // STAGING 윈도우 상태: RUNNING2(id3,id4)/SUCCESS1(id13)/FAILED2(id8,id17), 나머지 0.
                .andExpect(jsonPath("$.statusStatsByEnvironment[1].statusStats[1].count").value(2))
                .andExpect(jsonPath("$.statusStatsByEnvironment[1].statusStats[2].count").value(1))
                .andExpect(jsonPath("$.statusStatsByEnvironment[1].statusStats[3].count").value(2))
                // PRODUCTION 윈도우 상태: SUCCESS6(id1,9,10,14,16,18)/ROLLED_BACK1(id11), 나머지 0.
                .andExpect(jsonPath("$.statusStatsByEnvironment[2].statusStats[2].count").value(6))
                .andExpect(jsonPath("$.statusStatsByEnvironment[2].statusStats[4].count").value(1));
    }

    @Test
    void getServicePipelineReturnsThreeStagesWithLatestPerEnvironment() throws Exception {
        // serviceId=1(customer-web) 배포 환경별 최신(deployedAt desc, id desc):
        //   DEV=id5(v1.2.5 QUEUED, 오늘), STAGING=id8(v1.2.4 FAILED, D-1), PRODUCTION=id1(v1.2.3 SUCCESS, D-3).
        // R4 정합: 버전 DEV v1.2.5 ≥ STAGING v1.2.4 ≥ PROD v1.2.3, 그리고 PROD(D-3)는 STAGING 실패(D-1) 이전 → 역행 없음.
        mockMvc.perform(get("/api/dashboard/pipeline").param("serviceId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].environment").value("DEV"))
                .andExpect(jsonPath("$[1].environment").value("STAGING"))
                .andExpect(jsonPath("$[2].environment").value("PRODUCTION"))
                // DEV 최신: id5(QUEUED) → finishedAt null.
                .andExpect(jsonPath("$[0].deploymentId").value(5))
                .andExpect(jsonPath("$[0].serviceName").value("customer-web"))
                .andExpect(jsonPath("$[0].version").value("v1.2.5"))
                .andExpect(jsonPath("$[0].status").value("QUEUED"))
                .andExpect(jsonPath("$[0].branch").value("develop"))
                .andExpect(jsonPath("$[0].deployedBy").value("mason"))
                .andExpect(jsonPath("$[0].deployedAt").exists())
                .andExpect(jsonPath("$[0].finishedAt").doesNotExist())
                // STAGING 최신: id8(FAILED).
                .andExpect(jsonPath("$[1].deploymentId").value(8))
                .andExpect(jsonPath("$[1].version").value("v1.2.4"))
                .andExpect(jsonPath("$[1].status").value("FAILED"))
                .andExpect(jsonPath("$[1].finishedAt").exists())
                // PRODUCTION 최신: id1(v1.2.3, D-3) 이 옛 PROD id27(v1.1.9, D-18) 보다 최신.
                .andExpect(jsonPath("$[2].deploymentId").value(1))
                .andExpect(jsonPath("$[2].version").value("v1.2.3"))
                .andExpect(jsonPath("$[2].status").value("SUCCESS"));
    }

    @Test
    void getServicePipelineWithNoDeploymentsReturnsThreeEmptyCards() throws Exception {
        // serviceId=8(billing-cron) 은 시드에 배포가 없다 → 빈 카드 3개를 200 으로 반환(404 아님).
        mockMvc.perform(get("/api/dashboard/pipeline").param("serviceId", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].environment").value("DEV"))
                .andExpect(jsonPath("$[0].deploymentId").doesNotExist())
                .andExpect(jsonPath("$[1].environment").value("STAGING"))
                .andExpect(jsonPath("$[2].environment").value("PRODUCTION"))
                .andExpect(jsonPath("$[2].deploymentId").doesNotExist());
    }

    @Test
    void getServicePipelineTieBreaksByIdDesc() throws Exception {
        // serviceId=1 PRODUCTION 에 동일 deployedAt(미래) 2건 생성 → id37, id38.
        // 환경별 최신은 deployedAt desc, id desc 이므로 PRODUCTION 은 id38(tie-b) 가 채택돼야 한다.
        String tieA = """
                {
                  "serviceId": 1,
                  "version": "tie-a",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "tester",
                  "deployedAt": "2099-01-01T00:00:00"
                }
                """;
        String tieB = """
                {
                  "serviceId": 1,
                  "version": "tie-b",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "tester",
                  "deployedAt": "2099-01-01T00:00:00"
                }
                """;
        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tieA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(37));
        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(tieB))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(38));

        mockMvc.perform(get("/api/dashboard/pipeline").param("serviceId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[2].environment").value("PRODUCTION"))
                .andExpect(jsonPath("$[2].deploymentId").value(38))
                .andExpect(jsonPath("$[2].version").value("tie-b"));
    }

    @Test
    void getServicePipelineWithMissingServiceReturnsNotFound() throws Exception {
        mockMvc.perform(get("/api/dashboard/pipeline").param("serviceId", "9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void getServicePipelineWithoutServiceIdReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/dashboard/pipeline"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getServicePipelineWithNonNumericServiceIdReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/dashboard/pipeline").param("serviceId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void dashboardSummaryExcludesFutureDeploymentsFromWeeklyWindow() throws Exception {
        // 미래 일시(today+1)의 배포를 1건 생성한다. "최근 7일" 윈도우 상한이 today 끝까지로 고정되었으므로
        // 이 미래 배포는 weeklyDeploymentCount·series·points 어디에도 집계되어선 안 된다(상한 경계 정합성).
        // SUCCESS 미래 배포가 추가돼도 상태별 추이의 SUCCESS 버킷 합이 부풀지 않아 series↔KPI 정합성이 유지된다.
        String futureDeployedAt = java.time.LocalDate.now().plusDays(1).atTime(9, 0).toString();
        String futureDeployment = """
                {
                  "serviceId": 1,
                  "version": "future-1",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "tester",
                  "deployedAt": "%s"
                }
                """.formatted(futureDeployedAt);

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(futureDeployment))
                .andExpect(status().isCreated());

        // 미래 배포가 추가됐음에도 윈도우 KPI 는 시드 그대로 18 이어야 한다(미수정 시 19 로 오염).
        String response = mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weeklyDeploymentCount").value(18))
                .andExpect(jsonPath("$.deploymentTrendByStatus.series", hasSize(3)))
                .andExpect(jsonPath("$.deploymentTrendByStatus.points", hasSize(7)))
                .andReturn().getResponse().getContentAsString();

        // 핵심 정합성 단언: series 전 버킷을 7개 포인트에 걸쳐 합산한 값(차트 총 건수)이
        // KPI weeklyDeploymentCount 와 정확히 일치한다(미래 배포가 어느 모집단에도 들어가지 않음).
        com.fasterxml.jackson.databind.JsonNode root =
                new com.fasterxml.jackson.databind.ObjectMapper().readTree(response);
        long weeklyDeploymentCount = root.get("weeklyDeploymentCount").asLong();
        com.fasterxml.jackson.databind.JsonNode trend = root.get("deploymentTrendByStatus");
        long seriesTotal = 0;
        for (com.fasterxml.jackson.databind.JsonNode point : trend.get("points")) {
            for (com.fasterxml.jackson.databind.JsonNode seriesName : trend.get("series")) {
                seriesTotal += point.get(seriesName.asText()).asLong();
            }
        }
        org.junit.jupiter.api.Assertions.assertEquals(weeklyDeploymentCount, seriesTotal,
                "series 7일 총합이 KPI weeklyDeploymentCount 와 일치해야 한다");
        org.junit.jupiter.api.Assertions.assertEquals(18L, seriesTotal);
    }

    @Test
    void getDeploymentsFilteredByBranch() throws Exception {
        // 시드의 develop 브랜치(DEV·gitflow) 배포: id 2,5,6,7,12,15,21,29,30,31,34 = 11건. branch 는 정확히 일치 필터다.
        mockMvc.perform(get("/api/deployments").param("branch", "develop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(11)))
                .andExpect(jsonPath("$.totalElements").value(11))
                .andExpect(jsonPath("$.content[0].branch").value("develop"));
    }

    @Test
    void getDeploymentsFilteredByBranchCombinesWithStatus() throws Exception {
        // main 브랜치 + ROLLED_BACK: id 11(order-api v3.4.0), 19(admin-api v1.9.9) = 2건.
        mockMvc.perform(get("/api/deployments")
                        .param("branch", "main")
                        .param("status", "ROLLED_BACK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].status").value("ROLLED_BACK"))
                .andExpect(jsonPath("$.content[0].branch").value("main"));
    }

    @Test
    void getDeploymentsFilteredByUnknownBranchReturnsEmpty() throws Exception {
        mockMvc.perform(get("/api/deployments").param("branch", "no-such-branch"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void createQueuedDeploymentHasNullTimingAndDuration() throws Exception {
        // QUEUED: startedAt/finishedAt 미지정 → durationSec 파생값 null.
        String body = """
                {
                  "serviceId": 1,
                  "version": "v9.0.0",
                  "environment": "DEV",
                  "status": "QUEUED",
                  "deployedBy": "tester",
                  "deployedAt": "2026-06-28T15:00:00",
                  "branch": "develop"
                }
                """;

        String location = mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("QUEUED"))
                .andExpect(jsonPath("$.startedAt").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.finishedAt").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.durationSec").value(org.hamcrest.Matchers.nullValue()))
                .andReturn().getResponse().getHeader("Location");

        // 생성 후 조회로도 동일 shape 확인(QUEUED 도 조회 가능).
        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("QUEUED"))
                .andExpect(jsonPath("$.durationSec").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void createRunningDeploymentHasStartedButNullDuration() throws Exception {
        // RUNNING: startedAt 만 존재, finishedAt null → durationSec null.
        String body = """
                {
                  "serviceId": 2,
                  "version": "v9.1.0",
                  "environment": "DEV",
                  "status": "RUNNING",
                  "deployedBy": "tester",
                  "deployedAt": "2026-06-28T15:00:00",
                  "startedAt": "2026-06-28T15:00:00",
                  "branch": "develop"
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RUNNING"))
                .andExpect(jsonPath("$.startedAt").value("2026-06-28T15:00:00"))
                .andExpect(jsonPath("$.finishedAt").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.durationSec").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void createDeploymentWithFinishedBeforeStartedReturnsBadRequest() throws Exception {
        String body = """
                {
                  "serviceId": 1,
                  "version": "v9.2.0",
                  "environment": "PRODUCTION",
                  "status": "SUCCESS",
                  "deployedBy": "tester",
                  "deployedAt": "2026-06-28T15:00:00",
                  "startedAt": "2026-06-28T15:10:00",
                  "finishedAt": "2026-06-28T15:00:00"
                }
                """;

        mockMvc.perform(post("/api/deployments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }
}
