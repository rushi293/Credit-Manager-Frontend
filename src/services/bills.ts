import { apiClient } from './api';
import type { CreditBill, ApiResponse } from '../types';

export const billService = {
  async getBills(customerId?: string, archived: boolean = false, status?: string) {
    const params: any = {};
    if (customerId) params.customerId = customerId;
    if (archived) params.archived = 'true';
    if (status) params.status = status;
    const response = await apiClient.get<ApiResponse<CreditBill[]>>('/bills', { params: Object.keys(params).length ? params : undefined });
    return response.data.data;
  },

  async getBillById(id: string) {
    const response = await apiClient.get<ApiResponse<CreditBill>>(`/bills/${id}`);
    return response.data.data;
  },

  async createBill(data: { customerId: string, billNumber: string, billDate: string, dueDate?: string, totalAmount: number, notes?: string }) {
    const response = await apiClient.post<ApiResponse<CreditBill>>('/bills', data);
    return response.data.data;
  },

  async uploadAttachment(billId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/attachments/bills/${billId}`, formData);
    return response.data;
  },

  async deleteAttachment(attachmentId: string) {
    const response = await apiClient.delete(`/attachments/${attachmentId}`);
    return response.data;
  },

  
  async updateBill(id: string, data: { customerId: string, billDate: string, dueDate?: string, totalAmount: number, notes?: string }) {
    const response = await apiClient.put<ApiResponse<CreditBill>>(`/bills/${id}`, data);
    return response.data.data;
  },

  async archiveBill(billId: string) {
    const response = await apiClient.put(`/bills/${billId}/archive`);
    return response.data;
  },

  async deleteBill(billId: string) {
    const response = await apiClient.delete(`/bills/${billId}`);
    return response.data;
  }
};
