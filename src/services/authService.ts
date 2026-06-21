import api from "./api"
import type { User, UserRole } from "../types"

export interface LoginResponse {
  user?: User
  token?: string
  refreshToken?: string
  requiresOTP?: boolean
  tempToken?: string
  message?: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

export const authService = {
  login: async (email: string, password: string, role: UserRole): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", { email, password, role })
    return response.data
  },

  verifyOtp: async (tempToken: string, otp: string): Promise<LoginResponse> => {
    const response = await api.post("/auth/verify-otp", { tempToken, otp })
    return response.data
  },

  resendOtp: async (tempToken: string): Promise<void> => {
    await api.post("/auth/resend-otp", { tempToken })
  },

  enable2FA: async (): Promise<{ twoFactorEnabled: boolean }> => {
    const response = await api.post("/auth/enable-2fa")
    return response.data
  },

  disable2FA: async (password: string): Promise<void> => {
    await api.post("/auth/disable-2fa", { password })
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post("/auth/register", data)
    return response.data
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post("/auth/forgot-password", { email })
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await api.post("/auth/reset-password", { token, password })
  },

  refreshToken: async (refreshToken: string): Promise<{ token: string }> => {
    const response = await api.post("/auth/refresh", { refreshToken })
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/auth/me")
    return response.data.user
  },

  updateProfile: async (userId: string, updates: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${userId}`, updates)
    return response.data.user
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put("/auth/change-password", { currentPassword, newPassword })
  },
}
