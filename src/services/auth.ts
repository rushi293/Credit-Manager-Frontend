
import { apiClient } from "./api";
import type { ApiResponse } from "../types";

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  business: {
    id: string;
    name: string;
  };
}

export const authService = {
  async register(data: any) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", data);
    return response.data.data;
  },

  async login(data: any) {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", data);
    return response.data.data;
  },

  async logout() {
    try {
      await apiClient.post<ApiResponse<any>>("/auth/logout");
    } catch (e) {
      console.error('Logout failed:', e);
    }
  },

  async getMe() {
    const response = await apiClient.get<ApiResponse<{ user: User, business: any }>>("/auth/me");
    return response.data.data;
  },

  async updateCredentials(data: { email: string, currentPassword: string, newPassword?: string }) {
    const response = await apiClient.put<ApiResponse<any>>("/auth/credentials", data);
    return response.data;
  },

  async createStaff(data: any) {
    const response = await apiClient.post<ApiResponse<any>>("/auth/staff", data);
    return response.data;
  }
};

