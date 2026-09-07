'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '@/lib/api/auth'
import { usersApi } from '@/lib/api/users'
import {
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getAccessToken,
} from '@/lib/api/client'
import type { User, LoginRequest, RegisterRequest } from '@/types'

// --------------------------------------------------------------------------
// Context shape
// --------------------------------------------------------------------------
interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// --------------------------------------------------------------------------
// Provider
// --------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount, restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setUser(await usersApi.getMe())
      } catch {
        clearTokens()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const tokens = await authApi.login(data)
    setAccessToken(tokens.accessToken)
    setRefreshToken(tokens.refreshToken)
    const me = await usersApi.getMe()
    setUser(me)
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data)
    // Registration does not auto-login; user must verify OTP first
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Best-effort — clear tokens regardless
    }
    clearTokens()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await usersApi.getMe()
    setUser(me)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// --------------------------------------------------------------------------
// Hook
// --------------------------------------------------------------------------
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
