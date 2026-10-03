import { apiClient } from './api';
import type { DailyBill, ApiResponse } from '../types';

export const dailyBillService = {
  async getDailyBills(date?: string, status?: string, paymentMethod?: string) {
    const params: any = {};
    if (date) params.date = date;
    if (status && status !== 'All') params.status = status;
    if (paymentMethod && paymentMethod !== 'All') params.paymentMethod = paymentMethod;

    const response = await apiClient.get<ApiResponse<DailyBill[]>>('/daily-bills', { 
      params: Object.keys(params).length ? params : undefined 
    });
    return response.data.data || [];
  },

  async createDailyBill(data: Partial<DailyBill>) {
    const response = await apiClient.post<ApiResponse<DailyBill>>('/daily-bills', data);
    return response.data;
  },

  async updateDailyBill(id: string, data: Partial<DailyBill>) {
    const response = await apiClient.put<ApiResponse<DailyBill>>(`/daily-bills/${id}`, data);
    return response.data;
  },

  async deleteDailyBill(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(`/daily-bills/${id}`);
    return response.data;
  }
};
