import { apiClient } from './client';
import type {
  DeploymentCreateRequest,
  DeploymentListResponse,
  DeploymentResponse,
  DeploymentSearchParams,
  DeploymentUpdateRequest,
  PageResponse,
} from './types';

export async function getDeployments(params?: DeploymentSearchParams) {
  const { data } = await apiClient.get<PageResponse<DeploymentListResponse>>('/api/deployments', { params });
  return data;
}

export async function getDeployment(deploymentId: number) {
  const { data } = await apiClient.get<DeploymentResponse>(`/api/deployments/${deploymentId}`);
  return data;
}

export async function createDeployment(request: DeploymentCreateRequest) {
  const { data } = await apiClient.post<DeploymentResponse>('/api/deployments', request);
  return data;
}

export async function updateDeployment(deploymentId: number, request: DeploymentUpdateRequest) {
  const { data } = await apiClient.patch<DeploymentResponse>(`/api/deployments/${deploymentId}`, request);
  return data;
}

export async function deleteDeployment(deploymentId: number) {
  await apiClient.delete(`/api/deployments/${deploymentId}`);
}
