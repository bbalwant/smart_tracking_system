"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { User, login as apiLogin, register as apiRegister, getCurrentUser, logout as apiLogout, setToken, getToken, LoginCredentials, RegisterData, TokenResponse } from "@/lib/api/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (token) {
        try {
          const userData = await getCurrentUser()
          setUser(userData)
        } catch (error) {
          // Token is invalid, remove it
          apiLogout()
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const response: TokenResponse = await apiLogin(credentials)
    setToken(response.access_token)
    setUser(response.user)
  }

  const register = async (data: RegisterData) => {
    const response: TokenResponse = await apiRegister(data)
    setToken(response.access_token)
    setUser(response.user)
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

