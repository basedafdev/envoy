import { create } from 'zustand'

type UserRole = 'client' | 'agent'

interface AuthState {
  address: string | null
  role: UserRole | null
  isConnected: boolean
  setRole: (role: UserRole) => void
  connect: (address: string) => void
  disconnect: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
  role: 'agent',
  isConnected: true,
  setRole: (role) => set({ role }),
  connect: (address) => set({ address, isConnected: true }),
  disconnect: () => set({ address: null, role: null, isConnected: false }),
}))
