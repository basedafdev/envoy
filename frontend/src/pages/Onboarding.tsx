import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, RefreshDouble, Mail, ArrowLeft } from 'iconoir-react'
import { useCircleWallet } from '../hooks/useCircleWallet'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

export default function Onboarding() {
  const { isSDKReady, isLoading, error, createDeviceToken, loginWithSocial, sendEmailOtp, verifyEmailOtp } = useCircleWallet()

  const [initError, setInitError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [activeLoginMethod, setActiveLoginMethod] = useState<'google' | 'apple' | 'email' | null>(null)



  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setInitError(null)
    setActiveLoginMethod(provider)

    try {
      if (!isSDKReady) {
        setInitError('Circle SDK not ready. Please refresh.')
        setActiveLoginMethod(null)
        return
      }

      await createDeviceToken()
      await loginWithSocial(provider)
    } catch (err) {
      setInitError((err as Error).message || 'Login failed')
      setActiveLoginMethod(null)
    }
  }

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setInitError('Please enter your email')
      return
    }

    setInitError(null)
    setActiveLoginMethod('email')

    try {
      await sendEmailOtp(email)
      setOtpSent(true)
    } catch (err) {
      setInitError((err as Error).message || 'Failed to send OTP')
    } finally {
      setActiveLoginMethod(null)
    }
  }

  const handleVerifyOtp = () => {
    setInitError(null)
    setActiveLoginMethod('email')

    try {
      verifyEmailOtp()
    } catch (err) {
      setInitError((err as Error).message || 'Failed to open verification')
      setActiveLoginMethod(null)
    }
  }

  const handleBackToEmail = () => {
    setOtpSent(false)
    setEmail('')
    setInitError(null)
  }

  const showLoading = isLoading

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#2d2d2d] text-slate-200 overflow-x-hidden"
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a3a3a] via-[#2d2d2d] to-[#252525]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        <div className="w-full lg:w-[55%] min-h-screen flex flex-col justify-center px-8 lg:px-12 xl:px-20 py-12">
          <div className="max-w-md mx-auto lg:mx-0 w-full">
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
              <div className="mb-8">
                <img src="/logo.png" alt="Envoy" className="h-10" />
              </div>

              {!otpSent && (
                <>
                  <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                    <span className="bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                      Sign in to Envoy
                    </span>
                  </h1>

                  <p className="text-lg text-gray-400 mb-8">
                    Create your wallet and start using the AI agent marketplace
                  </p>
                </>
              )}

              {(error || initError) && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
                  {error || initError}
                </div>
              )}

              {!otpSent ? (
                <>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleSocialLogin('google')}
                      disabled={showLoading || activeLoginMethod !== null}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activeLoginMethod === 'google' ? (
                        <RefreshDouble className="w-5 h-5 animate-spin" />
                      ) : (
                        <GoogleIcon className="w-5 h-5" />
                      )}
                      <span>Continue with Google</span>
                    </button>

                    <button
                      onClick={() => handleSocialLogin('apple')}
                      disabled={showLoading || activeLoginMethod !== null}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-black text-white font-semibold border border-white/20 hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activeLoginMethod === 'apple' ? (
                        <RefreshDouble className="w-5 h-5 animate-spin" />
                      ) : (
                        <AppleIcon className="w-5 h-5" />
                      )}
                      <span>Continue with Apple</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-gray-500 text-sm">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={activeLoginMethod !== null}
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                    <button
                      onClick={handleSendOtp}
                      disabled={!email.trim() || activeLoginMethod !== null}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white font-semibold hover:bg-white/[0.12] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activeLoginMethod === 'email' ? (
                        <RefreshDouble className="w-5 h-5 animate-spin" />
                      ) : (
                        <Mail className="w-5 h-5" />
                      )}
                      <span>Continue with Email</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleBackToEmail}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back</span>
                  </button>

                  <div className="text-center mb-6">
                    <Mail className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                    <p className="text-gray-400 text-sm">
                      We sent a verification code to <span className="text-white">{email}</span>
                    </p>
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={activeLoginMethod === 'email'}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900 font-bold hover:from-white hover:to-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {activeLoginMethod === 'email' ? (
                      <RefreshDouble className="w-5 h-5 animate-spin" />
                    ) : null}
                    <span>Enter Verification Code</span>
                  </button>

                  <button
                    onClick={handleSendOtp}
                    disabled={activeLoginMethod === 'email'}
                    className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Didn't receive the code? <span className="text-cyan-400">Resend</span>
                  </button>
                </div>
              )}

              <p className="mt-8 text-gray-500 text-sm text-center">
                By continuing, you agree to Envoy's Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[45%] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#2d2d2d]" />

          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-gray-400/10 rounded-full blur-[80px]" />

            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />

            <div className="absolute top-[20%] right-[15%] w-64 h-40 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl" />
            <div className="absolute top-[35%] right-[25%] w-48 h-32 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-xl" />
            <div className="absolute bottom-[25%] right-[20%] w-56 h-36 bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-cyan-400/20 to-purple-500/20 backdrop-blur-xl border border-white/[0.1] flex items-center justify-center">
                  <Cpu className="w-12 h-12 text-cyan-400/80" />
                </div>
                <h2 className="text-2xl font-bold text-white/80 mb-2">AI Agent Marketplace</h2>
                <p className="text-gray-500 max-w-xs">
                  Deploy, hire, and collaborate with autonomous AI agents
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
