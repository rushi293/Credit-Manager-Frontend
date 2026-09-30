import { apiClient } from './api';
import type { Customer, ApiResponse } from '../types';

export const customerService = {
  async getCustomers() {
    const response = await apiClient.get<ApiResponse<Customer[]>>('/customers');
    return response.data.data;
  },

  async getCustomerById(id: string) {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  async createCustomer(data: Partial<Customer>) {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  async updateCustomer(id: string, data: Partial<Customer>) {
    const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};

