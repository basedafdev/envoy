import type { W3SSdk } from '@circle-fin/w3s-pw-web-sdk'

export type SocialProvider = 'google' | 'apple' | 'facebook'

export interface EmailLoginConfig {
  otpToken: string
  deviceToken: string
  deviceEncryptionKey: string
}

export interface LoginResult {
  userId: string
  userToken: string
  encryptionKey: string
  refreshToken?: string
}

export interface Wallet {
  id: string
  address: string
  blockchain: string
  state: string
}

export interface CircleConfig {
  appId: string
  googleClientId?: string
  appleClientId?: string
  redirectUri?: string
}

type LoginCallback = (error: unknown, result: LoginResult | null) => void

class CircleWalletClient {
  private sdk: W3SSdk | null = null
  private config: CircleConfig
  private loginCallback: LoginCallback | null = null
  private deviceId: string | null = null

  constructor() {
    this.config = {
      appId: import.meta.env.VITE_CIRCLE_APP_ID || '',
      googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
    }
    console.log('Circle SDK config:', this.config)
  }

  async initSDK(onLoginComplete: LoginCallback): Promise<void> {
    if (this.sdk) return

    const { W3SSdk } = await import('@circle-fin/w3s-pw-web-sdk')

    this.loginCallback = onLoginComplete

    // Load stored device tokens (needed to process OAuth callback after redirect)
    const storedDeviceToken = this.getStoredValue('deviceToken') || ''
    const storedDeviceEncryptionKey = this.getStoredValue('deviceEncryptionKey') || ''
    
    console.log('Initializing SDK with stored tokens:', { 
      hasDeviceToken: !!storedDeviceToken, 
      hasEncryptionKey: !!storedDeviceEncryptionKey 
    })

    this.sdk = new W3SSdk(
      {
        appSettings: { appId: this.config.appId },
        loginConfigs: {
          deviceToken: storedDeviceToken,
          deviceEncryptionKey: storedDeviceEncryptionKey,
          google: {
            clientId: this.config.googleClientId || '',
            redirectUri: this.config.redirectUri || '',
          },
        },
      },
      (error: unknown, result: unknown) => {
        console.log('SDK login callback:', { error, result })
        if (this.loginCallback) {
          this.loginCallback(error, result as LoginResult | null)
        }
      }
    )
  }

  async getDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId

    const cached = this.getStoredValue('deviceId')
    if (cached) {
      this.deviceId = cached
      return cached
    }

    if (!this.sdk) {
      throw new Error('SDK not initialized')
    }

    const id = await this.sdk.getDeviceId()
    this.deviceId = id
    this.setStoredValue('deviceId', id)
    return id
  }

  updateLoginConfigs(deviceToken: string, deviceEncryptionKey: string): void {
    if (!this.sdk) return

    this.setStoredValue('deviceToken', deviceToken)
    this.setStoredValue('deviceEncryptionKey', deviceEncryptionKey)

    this.sdk.updateConfigs({
      appSettings: { appId: this.config.appId },
      loginConfigs: {
        deviceToken,
        deviceEncryptionKey,
        google: {
          clientId: this.config.googleClientId || '',
          redirectUri: this.config.redirectUri || '',
          selectAccountPrompt: true,
        },
      },
    })
  }

  async performSocialLogin(provider: SocialProvider): Promise<void> {
    if (!this.sdk) {
      throw new Error('SDK not initialized')
    }

    const { SocialLoginProvider } = await import('@circle-fin/w3s-pw-web-sdk/dist/src/types')
    
    const providerMap = {
      google: SocialLoginProvider.GOOGLE,
      apple: SocialLoginProvider.APPLE,
      facebook: SocialLoginProvider.FACEBOOK,
    }

    this.sdk.performLogin(providerMap[provider])
  }

  updateEmailLoginConfigs(email: string, config: EmailLoginConfig): void {
    if (!this.sdk) return

    this.setStoredValue('deviceToken', config.deviceToken)
    this.setStoredValue('deviceEncryptionKey', config.deviceEncryptionKey)
    this.setStoredValue('otpToken', config.otpToken)

    this.sdk.updateConfigs({
      appSettings: { appId: this.config.appId },
      loginConfigs: {
        deviceToken: config.deviceToken,
        deviceEncryptionKey: config.deviceEncryptionKey,
        otpToken: config.otpToken,
        email: { email },
      } as any,
    })
  }

  verifyEmailOtp(): void {
    if (!this.sdk) {
      throw new Error('SDK not initialized')
    }

    this.sdk.verifyOtp()
  }



  setAuthentication(userToken: string, encryptionKey: string): void {
    if (!this.sdk) return
    this.sdk.setAuthentication({ userToken, encryptionKey })
  }

  executeChallenge(challengeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sdk) {
        reject(new Error('SDK not initialized'))
        return
      }

      this.sdk.execute(challengeId, (error: unknown) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  clearSession(): void {
    this.removeStoredValue('deviceId')
    this.removeStoredValue('deviceToken')
    this.removeStoredValue('deviceEncryptionKey')
    this.removeStoredValue('otpToken')
    this.deviceId = null
    this.sdk = null
    this.loginCallback = null
  }

  isConfigured(): boolean {
    return !!this.config.appId && !!this.config.googleClientId
  }

  private getStoredValue(key: string): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(`circle_${key}`) || null
  }

  private setStoredValue(key: string, value: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(`circle_${key}`, value)
  }

  private removeStoredValue(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(`circle_${key}`)
  }
}

export const circleWallet = new CircleWalletClient()
