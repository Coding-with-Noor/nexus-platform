"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import type { User, UserRole, AuthContextType } from "../types"
import { authService } from "../services/authService"
import userService from "../services/userService"
import toast from "react-hot-toast"

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Local storage keys
const USER_STORAGE_KEY = "business_nexus_user"
const TOKEN_STORAGE_KEY = "business_nexus_token"
const REFRESH_TOKEN_STORAGE_KEY = "business_nexus_refresh_token"

// Helper function to normalize user data from backend
const normalizeUserData = (userData: any): User => {
  if (!userData) return userData
  const id =
    userData.id?.toString?.() ||
    userData._id?.toString?.() ||
    (typeof userData._id === "string" ? userData._id : undefined)
  return {
    ...userData,
    id: id || userData.id,
  }
}

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for stored user on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY)
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)

        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)

            if (parsedUser?.id) {
              try {
                const currentUser = (await Promise.race([
                  authService.getCurrentUser(),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 5000)),
                ])) as User

                const normalizedUser = normalizeUserData(currentUser)
                setUser(normalizedUser)
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser))
              } catch (error) {
                console.warn("[v0] Failed to fetch current user, using stored user data:", error)
                // Keep the stored user data if API call fails
              }
            }
          } catch (parseError) {
            console.error("[v0] Failed to parse stored user data:", parseError)
            // Only clear storage if parsing fails
            localStorage.removeItem(USER_STORAGE_KEY)
            localStorage.removeItem(TOKEN_STORAGE_KEY)
            localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error("[v0] Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const completeLogin = async (userData: User, token: string, refreshToken: string): Promise<void> => {
    const normalizedUser = normalizeUserData(userData)

    if (!normalizedUser?.id) {
      throw new Error("Invalid user data received from server")
    }

    setUser(normalizedUser)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser))
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
    toast.success("Successfully logged in!")
  }

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true)

    try {
      const response = await authService.login(email, password, role)

      if (response.requiresOTP) {
        throw new Error("OTP verification required")
      }

      if (!response.user || !response.token || !response.refreshToken) {
        throw new Error("Invalid login response from server")
      }

      await completeLogin(response.user, response.token, response.refreshToken)
    } catch (error: any) {
      console.error("[v0] Login error:", error)
      const errorMessage = error.response?.data?.message || error.message || "Login failed"
      toast.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true)

    try {
      const response = await authService.register({ name, email, password, confirmPassword: password, role })

      // Normalize user data to handle _id from backend
      const normalizedUser = normalizeUserData(response.user)

      if (!normalizedUser?.id) {
        throw new Error("Invalid user data received from server")
      }

      // Store user data and tokens
      setUser(normalizedUser)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser))
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token)
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refreshToken)

      toast.success("Account created successfully!")
    } catch (error: any) {
      console.error("[v0] Registration error:", error)
      const errorMessage = error.response?.data?.message || error.message || "Registration failed"
      toast.error(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authService.forgotPassword(email)
      toast.success("Password reset instructions sent to your email")
    } catch (error: any) {
      console.error("[v0] Forgot password error:", error)
      const errorMessage = error.response?.data?.message || error.message || "Failed to send reset email"
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await authService.resetPassword(token, newPassword)
      toast.success("Password reset successfully")
    } catch (error: any) {
      console.error("[v0] Reset password error:", error)
      const errorMessage = error.response?.data?.message || error.message || "Password reset failed"
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const logout = (): void => {
    setUser(null)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    toast.success("Logged out successfully")
  }

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    if (!userId || userId === "undefined") {
      throw new Error("Invalid user ID provided")
    }

    try {
      const result = await userService.updateUser(userId, updates)
      if (!result.success || !result.data) {
        throw new Error(result.error || "Profile update failed")
      }
      const normalizedUser = normalizeUserData(result.data)

      if (user?.id === userId) {
        setUser(normalizedUser)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser))
      }

      toast.success("Profile updated successfully")
    } catch (error: any) {
      console.error("[v0] Update profile error:", error)
      const errorMessage = error.response?.data?.message || error.message || "Profile update failed"
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getUserId = (): string | null => {
    return user?.id || null
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success("Password changed successfully")
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Password change failed"
      toast.error(msg)
      throw new Error(msg)
    }
  }

  const enable2FA = async (): Promise<void> => {
    try {
      await authService.enable2FA()
      if (user) {
        const updated = { ...user, twoFactorEnabled: true }
        setUser(updated)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      }
      toast.success("Two-factor authentication enabled")
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to enable 2FA"
      toast.error(msg)
      throw new Error(msg)
    }
  }

  const disable2FA = async (password: string): Promise<void> => {
    try {
      await authService.disable2FA(password)
      if (user) {
        const updated = { ...user, twoFactorEnabled: false }
        setUser(updated)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      }
      toast.success("Two-factor authentication disabled")
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to disable 2FA"
      toast.error(msg)
      throw new Error(msg)
    }
  }

  const uploadAvatar = async (file: File): Promise<void> => {
    if (!user?.id) throw new Error("No user")
    try {
      const res = await userService.uploadAvatar(user.id, file)
      if (res.success && res.data?.avatarUrl) {
        const updated = normalizeUserData({ ...user, avatarUrl: res.data.avatarUrl })
        setUser(updated)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
        toast.success("Profile photo updated")
      } else {
        throw new Error(res.error || "Avatar upload failed")
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to upload avatar"
      toast.error(msg)
      throw new Error(msg)
    }
  }

  const value = {
    user,
    login,
    completeLogin,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
    getUserId,
    changePassword,
    enable2FA,
    disable2FA,
    uploadAvatar,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


