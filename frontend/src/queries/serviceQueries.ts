import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createService, deleteService, getService, getServices, updateService } from '../api/services';
import type { ServiceCreateRequest, ServiceSearchParams, ServiceUpdateRequest } from '../api/types';
import { dashboardKeys } from './dashboardQueries';

export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (params?: ServiceSearchParams) => [...serviceKeys.lists(), params] as const,
  detail: (serviceId: number) => [...serviceKeys.all, 'detail', serviceId] as const,
};

export function useServices(params?: ServiceSearchParams) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => getServices(params),
  });
}

export function useService(serviceId: number) {
  return useQuery({
    queryKey: serviceKeys.detail(serviceId),
    queryFn: () => getService(serviceId),
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ServiceCreateRequest) => createService(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateService(serviceId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ServiceUpdateRequest) => updateService(serviceId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serviceId: number) => deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
