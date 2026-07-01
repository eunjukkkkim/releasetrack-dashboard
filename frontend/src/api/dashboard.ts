import { apiClient } from './client';
import type { DashboardSummaryResponse, ServicePipelineStageResponse } from './types';

export async function getDashboardSummary() {
  const { data } = await apiClient.get<DashboardSummaryResponse>('/api/dashboard/summary');
  return data;
}

export async function getServicePipeline(serviceId: number) {
  const { data } = await apiClient.get<ServicePipelineStageResponse[]>('/api/dashboard/pipeline', {
    params: { serviceId },
  });
  return data;
}
