import { apiClient } from './api';

export interface DailyMetric {
  id: string;
  businessId: string;
  date: string;
  totalSales: number;
  totalExpense: number;
  totalIphoneSales: number;
}

const cache = new Map<string, { data: DailyMetric[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const metricsService = {
  async getMetrics(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const cacheKey = JSON.stringify(params);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await apiClient.get<{ success: boolean; data: DailyMetric[] }>('/metrics', { params });
    const data = response.data.data;
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  clearCache() {
    cache.clear();
  },

  async upsertMetric(data: { date: string, totalSales?: number, totalExpense?: number, totalIphoneSales?: number }) {
    const response = await apiClient.post<{ success: boolean; data: DailyMetric }>('/metrics', data);
    return response.data.data;
  }
};
