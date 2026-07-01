import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDeployment, deleteDeployment, getDeployment, getDeployments, updateDeployment } from '../api/deployments';
import type { DeploymentCreateRequest, DeploymentSearchParams, DeploymentUpdateRequest } from '../api/types';
import { dashboardKeys } from './dashboardQueries';
import { serviceKeys } from './serviceQueries';

export const deploymentKeys = {
  all: ['deployments'] as const,
  lists: () => [...deploymentKeys.all, 'list'] as const,
  list: (params?: DeploymentSearchParams) => [...deploymentKeys.lists(), params] as const,
  detail: (deploymentId: number) => [...deploymentKeys.all, 'detail', deploymentId] as const,
};

function invalidateRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: deploymentKeys.all });
  queryClient.invalidateQueries({ queryKey: serviceKeys.all });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
}

export function useDeployments(params?: DeploymentSearchParams) {
  return useQuery({
    queryKey: deploymentKeys.list(params),
    queryFn: () => getDeployments(params),
  });
}

export function useDeployment(deploymentId: number) {
  return useQuery({
    queryKey: deploymentKeys.detail(deploymentId),
    queryFn: () => getDeployment(deploymentId),
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: DeploymentCreateRequest) => createDeployment(request),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useUpdateDeployment(deploymentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: DeploymentUpdateRequest) => updateDeployment(deploymentId, request),
    onSuccess: () => invalidateRelated(queryClient),
  });
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deploymentId: number) => deleteDeployment(deploymentId),
    onSuccess: () => invalidateRelated(queryClient),
  });
}
