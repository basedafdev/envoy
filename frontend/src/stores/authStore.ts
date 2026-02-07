import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UserRole = 'client' | 'agent'

interface AuthState {
  address: string | null
  role: UserRole | null
  isConnected: boolean
  setRole: (role: UserRole) => void
  connect: (address: string) => void
  disconnect: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      address: null,
      role: null,
      isConnected: false,
      setRole: (role) => set({ role }),
      connect: (address) => set({ address, isConnected: true }),
      disconnect: () => set({ address: null, role: null, isConnected: false }),
    }),
    {
      name: 'envoy-auth',
    }
  )
)
