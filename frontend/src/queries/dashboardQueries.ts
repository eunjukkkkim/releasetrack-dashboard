import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary, getServicePipeline } from '../api/dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: ['dashboard', 'summary'] as const,
  pipeline: (serviceId: number) => ['dashboard', 'pipeline', serviceId] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: getDashboardSummary,
  });
}

export function useServicePipeline(serviceId: number) {
  return useQuery({
    queryKey: dashboardKeys.pipeline(serviceId),
    queryFn: () => getServicePipeline(serviceId),
    enabled: !!serviceId,
  });
}
