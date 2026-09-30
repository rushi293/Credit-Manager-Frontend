import { apiClient } from './api';
import type { Payment, PaymentMethod, ApiResponse } from '../types';

export const paymentService = {
  async getPayments(params?: { customerId?: string; creditBillId?: string }) {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/payments', { params });
    return response.data.data;
  },

  async createPayment(data: { 
    customerId: string; 
    creditBillId: string; 
    amount: number; 
    paymentMethod: PaymentMethod; 
    paymentDate: string; 
    notes?: string; 
  }) {
    const response = await apiClient.post<ApiResponse<Payment>>('/payments', data);
    return response.data.data;
  }
};
