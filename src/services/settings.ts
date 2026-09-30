import { apiClient } from './api';

export interface Business {
  id: string;
  name: string;
  defaultDuePeriod: number;
}

export const settingsService = {
  updateSettings: async (data: Partial<Business>) => {
    const response = await apiClient.put<{ success: boolean; data: Business }>('/settings', data);
    return response.data.data;
  },
};
