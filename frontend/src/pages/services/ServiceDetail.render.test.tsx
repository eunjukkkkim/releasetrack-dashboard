import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ServiceResponse, ServiceStatus } from "../../api/types";
import { ServiceDetail } from "./ServiceDetail";

/**
 * 상호작용 회귀 가드: 빌드/타입/순수테스트로는 못 잡는 클릭 경로를 검증한다.
 * (1) '삭제' → 확인 모달 → 확인 시 PATCH {status:'ARCHIVED'} 호출.
 * (2) ARCHIVED 서비스는 폼 잠금 + 저장 비활성 + '복원' 노출.
 */

const mutateAsync = vi.fn().mockResolvedValue(undefined);
const deleteMutateAsync = vi.fn().mockResolvedValue(undefined);

function buildService(status: ServiceStatus): ServiceResponse {
  return {
    id: 1,
    name: "payments",
    description: "결제",
    owner: "kim",
    repositoryUrl: "https://example.com/repo",
    status,
    lastDeploymentVersion: "1.0.0",
    lastDeployedAt: "2026-06-30T10:00:00",
    createdAt: "2026-06-01T10:00:00",
    updatedAt: "2026-06-30T10:00:00",
  };
}

// 참조 안정성 필수: ServiceDetail의 useEffect가 [serviceQuery.data]에 의존하므로
// 렌더마다 새 객체를 반환하면 setForm→재렌더 무한루프가 된다.
const SERVICES: Record<ServiceStatus, ServiceResponse> = {
  ACTIVE: buildService("ACTIVE"),
  ARCHIVED: buildService("ARCHIVED"),
  MAINTENANCE: buildService("MAINTENANCE"),
};

let serviceStatus: ServiceStatus = "ACTIVE";
let deploymentTotal = 1;

vi.mock("../../queries/serviceQueries", () => ({
  useService: () => ({ data: SERVICES[serviceStatus], isLoading: false, isError: false }),
  useUpdateService: () => ({ mutateAsync, isPending: false }),
  useDeleteService: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}));

vi.mock("../../queries/deploymentQueries", () => ({
  useDeployments: () => ({
    data: { content: [], totalElements: deploymentTotal },
    isLoading: false,
    isError: false,
  }),
}));

function renderDetail() {
  return render(
    <MemoryRouter>
      <ServiceDetail serviceId={1} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  serviceStatus = "ACTIVE";
  deploymentTotal = 1;
  mutateAsync.mockClear();
  deleteMutateAsync.mockClear();
});
afterEach(cleanup);

describe("ServiceDetail archive/restore", () => {
  it("opens the confirm modal on 삭제 and patches status=ARCHIVED on confirm", async () => {
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/아카이브\(비활성\) 상태로 전환합니다/),
    ).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));
    expect(mutateAsync).toHaveBeenCalledWith({ status: "ARCHIVED" });
    expect(deleteMutateAsync).not.toHaveBeenCalled();
  });

  it("hard-deletes the service when there are no deployments", async () => {
    deploymentTotal = 0;
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/실제로 삭제할까요/)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));
    expect(deleteMutateAsync).toHaveBeenCalledWith(1);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("locks the form and shows 복원 when the service is ARCHIVED", () => {
    serviceStatus = "ARCHIVED";
    renderDetail();
    expect(screen.getByRole("button", { name: "복원" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
    expect((screen.getByRole("button", { name: "저장" }) as HTMLButtonElement).disabled).toBe(true);
    // 편집 가능한 저장소 URL은 잠긴다(read-only)
    const repoInput = screen.getByDisplayValue(
      "https://example.com/repo",
    ) as HTMLInputElement;
    expect(repoInput.disabled).toBe(true);
  });

  it("renders 서비스명/담당자 as read-only labels (not editable inputs)", () => {
    const { container } = renderDetail(); // ACTIVE 서비스
    // 서비스명/담당자 값은 텍스트로 노출되되 편집 input이 아니어야 한다.
    expect(screen.queryByDisplayValue("payments")).toBeNull();
    expect(screen.queryByDisplayValue("kim")).toBeNull();
    const detailItems = Array.from(
      container.querySelectorAll(".detail-item"),
    ).map((el) => el.textContent ?? "");
    expect(
      detailItems.some((t) => t.includes("서비스명") && t.includes("payments")),
    ).toBe(true);
    expect(
      detailItems.some((t) => t.includes("담당자") && t.includes("kim")),
    ).toBe(true);
  });

  it("patches status=ACTIVE on 복원", () => {
    serviceStatus = "ARCHIVED";
    renderDetail();
    fireEvent.click(screen.getByRole("button", { name: "복원" }));
    expect(mutateAsync).toHaveBeenCalledWith({ status: "ACTIVE" });
  });

  it("includes ARCHIVED as a selectable status option (Select is also an archive entry path)", () => {
    // Radix Select는 옵션 집합을 aria-hidden 네이티브 <select>에 미러링한다(포탈/포인터 없이 안정 검증).
    // ARCHIVED 선택 시 확인 모달을 경유해 아카이브하는 동작은 '삭제→모달→PATCH ARCHIVED' 테스트와
    // 동일한 handleArchive/모달을 공유하므로 여기선 옵션 노출만 검증한다(Radix select 상호작용은 jsdom 불안정).
    const { container } = renderDetail(); // ACTIVE 서비스
    const nativeSelect = container.querySelector("select") as HTMLSelectElement;
    const values = Array.from(nativeSelect?.options ?? []).map((o) => o.value);
    expect(values).toContain("ACTIVE");
    expect(values).toContain("MAINTENANCE");
    expect(values).toContain("ARCHIVED");
  });
});
