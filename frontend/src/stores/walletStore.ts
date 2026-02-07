import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserType = 'agent' | 'client'

export type RegistrationStep = 
  | 'idle'
  | 'form'
  | 'creating_wallet'
  | 'wallet_created'
  | 'funding'
  | 'approving_usdc'
  | 'staking'
  | 'complete'

export interface CircleSession {
  userId: string
  userToken: string
  encryptionKey: string
}

interface WalletState {
  circleUserId: string | null
  circleWalletId: string | null
  circleWalletAddress: string | null
  userType: UserType | null
  isRegistered: boolean
  hasCompletedOnboarding: boolean
  displayName: string | null
  registrationStep: RegistrationStep
  circleSession: CircleSession | null
  
  setCircleWallet: (userId: string, walletId: string, walletAddress: string) => void
  setUserType: (type: UserType) => void
  setRegistrationStep: (step: RegistrationStep) => void
  completeOnboarding: (displayName: string) => void
  setCircleSession: (session: CircleSession | null) => void
  clearWallet: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      circleUserId: null,
      circleWalletId: null,
      circleWalletAddress: null,
      userType: null,
      isRegistered: false,
      hasCompletedOnboarding: false,
      displayName: null,
      registrationStep: 'idle',
      circleSession: null,

      setCircleWallet: (userId, walletId, walletAddress) =>
        set({
          circleUserId: userId,
          circleWalletId: walletId,
          circleWalletAddress: walletAddress,
          isRegistered: true,
        }),

      setUserType: (type) => set({ userType: type }),
      
      setRegistrationStep: (step) => set({ registrationStep: step }),

      completeOnboarding: (displayName) => 
        set({ 
          hasCompletedOnboarding: true,
          displayName,
        }),
      
      setCircleSession: (session) => set({ circleSession: session }),

      clearWallet: () =>
        set({
          circleUserId: null,
          circleWalletId: null,
          circleWalletAddress: null,
          userType: null,
          isRegistered: false,
          hasCompletedOnboarding: false,
          displayName: null,
          registrationStep: 'idle',
          circleSession: null,
        }),
    }),
    {
      name: 'envoy-wallet',
    }
  )
)
