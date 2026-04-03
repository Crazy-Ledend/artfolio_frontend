import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import type { DiscordUser } from '../types'

interface AuthContextType {
  user: DiscordUser | null
  loading: boolean
  login: () => void
  logout: () => void
  setToken: (token: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => { },
  logout: () => { },
  setToken: () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DiscordUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async (token: string) => {
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },  // ✅ fixed
      })
      setUser(res.data)
      localStorage.setItem('artfolio-token', token)
    } catch (err: any) {
      // Token expired or invalid — clear it
      if (err.response?.status === 401) {
        localStorage.removeItem('artfolio-token')
      }
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('artfolio-token')
    if (token) {
      fetchMe(token)
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = () => {
    window.location.href = '/api/auth/discord'
  }

  const logout = () => {
    localStorage.removeItem('artfolio-token')
    setUser(null)
  }

  const setToken = (token: string) => {
    setLoading(true)
    fetchMe(token)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)