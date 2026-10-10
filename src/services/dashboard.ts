import { apiClient } from './api';
import type { DashboardData, ApiResponse } from '../types';

const cache = new Map<string, { data: DashboardData, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const dashboardService = {
  async getDashboardData(date?: string) {
    const key = date || 'today';
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    const params = date ? { date } : {};
    const response = await apiClient.get<ApiResponse<DashboardData>>('/dashboard', { params });
    cache.set(key, { data: response.data.data, timestamp: Date.now() });
    return response.data.data;
  },
  clearCache() {
    cache.clear();
  }
};
