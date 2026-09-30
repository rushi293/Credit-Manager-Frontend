import { apiClient } from './api';

export interface DailyMetric {
  id: string;
  businessId: string;
  date: string;
  totalSales: number;
  totalExpense: number;
  totalIphoneSales: number;
}

export const metricsService = {
  async getMetrics(startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get<{ success: boolean; data: DailyMetric[] }>('/metrics', { params });
    return response.data.data;
  },

  async upsertMetric(data: { date: string, totalSales?: number, totalExpense?: number, totalIphoneSales?: number }) {
    const response = await apiClient.post<{ success: boolean; data: DailyMetric }>('/metrics', data);
    return response.data.data;
  }
};
