import { apiClient } from "./api";
import type { ApiResponse } from "../types";
import type { User } from "./auth";

export interface LoginSession {
  id: string;
  userId: string;
  user: User;
  businessId: string;
  loginAt: string;
  lastActivityAt: string;
  revokedAt: string | null;
  isValid: boolean;
  createdAt: string;
}

export const adminService = {
  async getLoginSessions() {
    const response = await apiClient.get<ApiResponse<LoginSession[]>>("/admin/sessions");
    return response.data.data;
  },

  async logoutSession(sessionId: string) {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/sessions/${sessionId}/logout`);
    return response.data;
  },

  async getNonAdmins() {
    const response = await apiClient.get<ApiResponse<any[]>>("/admin/users");
    return response.data.data;
  },

  async updateNonAdmin(id: string, data: { email: string, newPassword?: string }) {
    const response = await apiClient.patch<ApiResponse<any>>(`/admin/users/${id}`, data);
    return response.data;
  },

  async deleteNonAdmin(id: string) {
    const response = await apiClient.delete<ApiResponse<any>>(`/admin/users/${id}`);
    return response.data;
  }
};