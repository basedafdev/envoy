import { useState, useCallback, useEffect, useRef } from 'react'
import { circleWallet, Wallet, SocialProvider } from '../services/circle-wallet'
import { useWalletStore, CircleSession } from '../stores/walletStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

interface UseCircleWalletReturn {
  isSDKReady: boolean
  isLoading: boolean
  error: string | null
  session: CircleSession | null
  wallets: Wallet[]

  createDeviceToken: () => Promise<void>
  loginWithSocial: (provider: SocialProvider) => Promise<void>
  sendEmailOtp: (email: string) => Promise<{ deviceToken: string; deviceEncryptionKey: string; otpToken: string }>
  verifyEmailOtp: () => void
  initializeUser: () => Promise<Wallet[] | void>
  loadWallets: () => Promise<Wallet[]>
  clearError: () => void
  signOut: () => void
}

export function useCircleWallet(): UseCircleWalletReturn {
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])

  const session = useWalletStore((state) => state.circleSession)
  const setSession = useWalletStore((state) => state.setCircleSession)

  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const initSDK = async () => {
      try {
        console.log('Initializing Circle SDK...')
        await circleWallet.initSDK((err, result) => {
          console.log('Circle SDK login callback triggered:', { err, result })
          if (err) {
            console.error('Login failed:', err)
            setError((err as Error).message || 'Login failed')
            setSession(null)
            return
          }

          if (result) {
            console.log('Setting session with userId:', result.userId)
            setSession({
              userId: result.userId,
              userToken: result.userToken,
              encryptionKey: result.encryptionKey,
            })
            setError(null)
          }
        })
        console.log('Circle SDK initialized successfully')
        setIsSDKReady(true)
      } catch (err) {
        console.error('Failed to initialize SDK:', err)
        setError('Failed to initialize Circle SDK')
      }
    }

    initSDK()
  }, [setSession])

  const createDeviceToken = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const deviceId = await circleWallet.getDeviceId()

      const response = await fetch(`${API_BASE}/api/auth/device-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create device token')
      }

      const data = await response.json()
      circleWallet.updateLoginConfigs(data.deviceToken, data.deviceEncryptionKey)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create device token'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWithSocial = useCallback(async (provider: SocialProvider) => {
    setIsLoading(true)
    setError(null)

    try {
      await circleWallet.performSocialLogin(provider)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Social login failed'
      setError(message)
      setIsLoading(false)
      throw err
    }
  }, [])

  const sendEmailOtp = useCallback(async (email: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const deviceId = await circleWallet.getDeviceId()

      const response = await fetch(`${API_BASE}/api/auth/email/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, deviceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      circleWallet.updateEmailLoginConfigs(email, {
        deviceToken: data.deviceToken,
        deviceEncryptionKey: data.deviceEncryptionKey,
        otpToken: data.otpToken,
      })

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyEmailOtp = useCallback(async () => {
    setError(null)

    try {
      circleWallet.verifyEmailOtp()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify OTP'
      setError(message)
      throw err
    }
  }, [])

  const initializeUser = useCallback(async () => {
    if (!session) {
      throw new Error('No session. Please login first.')
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/auth/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken: session.userToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize user')
      }

      if (data.alreadyInitialized) {
        const loadedWallets = await loadWallets()
        return loadedWallets
      }

      circleWallet.setAuthentication(session.userToken, session.encryptionKey)

      await new Promise(resolve => setTimeout(resolve, 500))
      await circleWallet.executeChallenge(data.challengeId)
      await new Promise(resolve => setTimeout(resolve, 2000))

      const loadedWallets = await loadWallets()
      return loadedWallets
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize user'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [session])

  const loadWallets = useCallback(async (): Promise<Wallet[]> => {
    if (!session) {
      throw new Error('No session')
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken: session.userToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load wallets')
      }

      const loadedWallets = data.wallets || []
      setWallets(loadedWallets)
      return loadedWallets
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wallets'
      setError(message)
      throw err
    }
  }, [session])

  const signOut = useCallback(() => {
    circleWallet.clearSession()
    setSession(null)
    setWallets([])
    setIsSDKReady(false)
    setError(null)
    initRef.current = false
  }, [setSession])

  return {
    isSDKReady,
    isLoading,
    error,
    session,
    wallets,
    createDeviceToken,
    loginWithSocial,
    sendEmailOtp,
    verifyEmailOtp,
    initializeUser,
    loadWallets,
    clearError: useCallback(() => setError(null), []),
    signOut,
  }
}
