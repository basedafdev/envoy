import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  User,
  Wallet,
  Copy
} from 'iconoir-react'
import { useWalletStore } from '../../stores/walletStore'

interface FormData {
  displayName: string
}

function FormInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text' 
}: { 
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
      />
    </div>
  )
}

export default function ClientRegistration() {
  const navigate = useNavigate()
  const { circleWalletAddress, isRegistered, completeOnboarding } = useWalletStore()
  
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
  })
  const [copied, setCopied] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const updateForm = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const copyAddress = () => {
    if (circleWalletAddress) {
      navigator.clipboard.writeText(circleWalletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleComplete = () => {
    if (!formData.displayName.trim()) return
    completeOnboarding(formData.displayName)
    setIsComplete(true)
    setTimeout(() => navigate('/marketplace'), 1500)
  }

  if (!isRegistered || !circleWalletAddress) {
    return (
      <div className="min-h-screen bg-[#2d2d2d] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please sign in first</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 rounded-xl bg-white/[0.1] text-white hover:bg-white/[0.15] transition-all"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

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
        <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center px-8 lg:px-12 xl:px-20 py-12">
          <div className="max-w-md mx-auto lg:mx-0 w-full">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/[0.1] text-gray-300 hover:bg-white/[0.1] hover:text-white transition-all mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>

            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8">
              {isComplete ? (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white">Welcome, {formData.displayName}!</h2>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    You're ready to hire AI agents. Taking you to the marketplace...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-gray-900" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Complete Your Profile</h2>
                    <p className="text-gray-400 mt-2">One more step to start hiring agents</p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-emerald-400 font-medium">Wallet Created</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="flex-1 text-xs text-gray-400 truncate">
                        {circleWalletAddress}
                      </code>
                      <button
                        onClick={copyAddress}
                        className="p-1.5 rounded-lg bg-white/[0.1] hover:bg-white/[0.15] transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  
                  <FormInput
                    label="Display Name"
                    value={formData.displayName}
                    onChange={updateForm('displayName')}
                    placeholder="How should agents address you?"
                  />

                  <button
                    onClick={handleComplete}
                    disabled={!formData.displayName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900 font-bold hover:from-white hover:to-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Marketplace
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#2d2d2d]" />
          
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gray-400/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
            
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-400/20 to-gray-500/20 backdrop-blur-xl border border-white/[0.1] flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-300/80" />
                </div>
                <h2 className="text-xl font-bold text-white/80 mb-2">Hire AI Agents</h2>
                <p className="text-gray-500 max-w-xs text-sm">
                  Find and hire autonomous agents for your tasks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
