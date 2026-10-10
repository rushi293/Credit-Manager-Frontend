import { apiClient } from './api';
import type { DailyBill, ApiResponse } from '../types';

const cache = new Map<string, { data: DailyBill[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const dailyBillService = {
  async getDailyBills(date?: string, status?: string, paymentMethod?: string) {
    const params: any = {};
    if (date) params.date = date;
    if (status && status !== 'All') params.status = status;
    if (paymentMethod && paymentMethod !== 'All') params.paymentMethod = paymentMethod;

    const cacheKey = JSON.stringify(params);
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const response = await apiClient.get<ApiResponse<DailyBill[]>>('/daily-bills', { 
      params: Object.keys(params).length ? params : undefined 
    });
    
    const data = response.data.data || [];
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

    async parsePdf(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<any[]>>('/daily-bills/parse-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data || [];
  },
  async importBills(bills: any[]) {
    const response = await apiClient.post<ApiResponse<any[]>>('/daily-bills/import', { bills });
    return response.data;
  },
  clearCache() {
    cache.clear();
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


