import { apiClient } from './client';
import type { ServiceCreateRequest, ServiceResponse, ServiceSearchParams, ServiceUpdateRequest } from './types';

export async function getServices(params?: ServiceSearchParams) {
  const { data } = await apiClient.get<ServiceResponse[]>('/api/services', { params });
  return data;
}

export async function getService(serviceId: number) {
  const { data } = await apiClient.get<ServiceResponse>(`/api/services/${serviceId}`);
  return data;
}

export async function createService(request: ServiceCreateRequest) {
  const { data } = await apiClient.post<ServiceResponse>('/api/services', request);
  return data;
}

export async function updateService(serviceId: number, request: ServiceUpdateRequest) {
  const { data } = await apiClient.patch<ServiceResponse>(`/api/services/${serviceId}`, request);
  return data;
}

export async function deleteService(serviceId: number) {
  await apiClient.delete(`/api/services/${serviceId}`);
}
