import { apiClient } from './api';
import type { DashboardData, ApiResponse } from '../types';

export const dashboardService = {
  async getDashboardData(date?: string) {
    const params = date ? { date } : {};
    const response = await apiClient.get<ApiResponse<DashboardData>>('/dashboard', { params });
    return response.data.data;
  }
};
