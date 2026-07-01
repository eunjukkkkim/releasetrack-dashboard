import { useEffect, useState } from "react";
import { EmptyBox, ErrorBox, LoadingBox } from "../../components/StateBox";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { SelectItem, numberToSelectValue } from "../../components/ui/select";
import { useServicePipeline } from "../../hooks/useDashboardSummary";
import { useServices } from "../../queries/serviceQueries";
import { safeStorage } from "../../lib/storage";
import { CardControlSelect } from "./DashboardBlock";
import { EnvironmentPipeline } from "./DashboardTables";
import {
  PIPELINE_SERVICE_STORAGE_KEY,
  resolveInitialServiceId,
} from "./dashboardBlocks";

export function PipelineCard({ onOpen }: { onOpen: (id: number) => void }) {
  const {
    data: services,
    isLoading: servicesLoading,
    isError: servicesError,
    error: servicesErrorObj,
  } = useServices();
  const [serviceId, setServiceId] = useState<number | null>(null);

  useEffect(() => {
    if (!services) {
      return;
    }
    const ids = services.map((service) => service.id);
    setServiceId((current) => {
      if (current != null && ids.includes(current)) {
        return current;
      }
      const storedRaw = safeStorage.get(PIPELINE_SERVICE_STORAGE_KEY);
      const storedId =
        storedRaw != null && storedRaw !== "" ? Number(storedRaw) : null;
      return resolveInitialServiceId(
        ids,
        Number.isNaN(storedId) ? null : storedId,
      );
    });
  }, [services]);

  const handleSelect = (id: number) => {
    setServiceId(id);
    safeStorage.set(PIPELINE_SERVICE_STORAGE_KEY, String(id));
  };

  const {
    data: stages,
    isLoading,
    isError,
    error,
  } = useServicePipeline(serviceId ?? 0);

  const renderBody = () => {
    if (servicesLoading) return <LoadingBox />;
    if (servicesError) return <ErrorBox error={servicesErrorObj} />;
    if (!services || services.length === 0) {
      return <EmptyBox description="등록된 서비스가 없습니다." />;
    }
    if (serviceId == null || isLoading) return <LoadingBox />;
    if (isError) return <ErrorBox error={error} />;
    if (!stages) {
      return <EmptyBox description="환경 파이프라인 데이터가 없습니다." />;
    }
    return <EnvironmentPipeline rows={stages} onOpen={onOpen} />;
  };

  return (
    <Card>
      <CardHeader className="rt-card-header-row">
        <CardTitle>환경 파이프라인 현황</CardTitle>
        {services && services.length > 0 && (
          <CardControlSelect
            value={numberToSelectValue(serviceId)}
            onValueChange={(val) => handleSelect(Number(val))}
            ariaLabel="파이프라인 서비스 선택"
            placeholder="서비스 선택"
          >
            {services.map((service) => (
              <SelectItem key={service.id} value={String(service.id)}>
                {service.name}
              </SelectItem>
            ))}
          </CardControlSelect>
        )}
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
