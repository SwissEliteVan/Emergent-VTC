import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulation d'authentification - A remplacer par API backend
        if (email && password) {
          set({
            user: {
              id: '1',
              email,
              name: email.split('@')[0],
              role: 'admin'
            },
            isAuthenticated: true
          })
          return true
        }
        return false
      },

      logout: () => {
        set({ user: null, isAuthenticated: false })
      }
    }),
    {
      name: 'crm-auth-storage'
    }
  )
)
