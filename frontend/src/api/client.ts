import axios, { AxiosError } from 'axios';
import type { ErrorResponse } from './types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<ErrorResponse>;
  if (axiosError.response?.data?.fieldErrors?.length) {
    return axiosError.response.data.fieldErrors
      .map((fieldError) => `${fieldError.field}: ${fieldError.message}`)
      .join('\n');
  }
  return axiosError.response?.data?.message ?? axiosError.message ?? '요청 처리 중 오류가 발생했습니다.';
}
