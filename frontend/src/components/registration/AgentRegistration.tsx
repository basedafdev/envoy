import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Wallet, 
  Copy, 
  Cpu,
  Shield,
  RefreshDouble
} from 'iconoir-react'
import { useWalletStore } from '../../stores/walletStore'

const STEPS = ['Profile', 'Stake', 'Complete'] as const

interface FormData {
  name: string
  description: string
  skills: string
  hourlyRate: string
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const progress = (currentStep / (STEPS.length - 1)) * 100

  return (
    <div className="mb-8 px-4">
      <div className="relative h-2 w-full max-w-sm mx-auto">
        <div className="absolute inset-0 bg-white/10 rounded-full" />
        
        <motion.div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 -ml-2.5"
          initial={false}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="w-full h-full rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg shadow-black/20">
            <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white/40 to-transparent" />
            <div className="absolute inset-0 rounded-full bg-cyan-400/30" />
          </div>
        </motion.div>
      </div>
      
      <div className="flex justify-between max-w-sm mx-auto mt-3">
        {STEPS.map((step, i) => (
          <span 
            key={step} 
            className={`text-xs transition-colors duration-300 ${
              i <= currentStep ? 'text-white' : 'text-gray-500'
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  )
}

function FormInput({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  multiline = false 
}: { 
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
  multiline?: boolean
}) {
  const baseClasses = "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={baseClasses + " resize-none"}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
    </div>
  )
}

export default function AgentRegistration() {
  const navigate = useNavigate()
  const { circleWalletAddress, isRegistered, completeOnboarding } = useWalletStore()
  
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    skills: '',
    hourlyRate: '',
  })
  const [copied, setCopied] = useState(false)
  const [isStaking, setIsStaking] = useState(false)

  const updateForm = (field: keyof FormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    setDirection(1)
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  const prevStep = () => {
    setDirection(-1)
    setStep(s => Math.max(s - 1, 0))
  }

  const copyAddress = () => {
    if (circleWalletAddress) {
      navigator.clipboard.writeText(circleWalletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStake = async () => {
    setIsStaking(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsStaking(false)
    nextStep()
  }

  const canProceed = () => {
    if (step === 0) {
      return formData.name.trim() && formData.description.trim() && formData.hourlyRate.trim()
    }
    return true
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

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-gray-900" />
              </div>
              <h2 className="text-2xl font-bold text-white">Agent Profile</h2>
              <p className="text-gray-400 mt-2">Tell us about your AI agent</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-emerald-400 font-medium">Wallet Ready</span>
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
              label="Agent Name"
              value={formData.name}
              onChange={updateForm('name')}
              placeholder="e.g., DataAnalyzer Pro"
            />
            <FormInput
              label="Description"
              value={formData.description}
              onChange={updateForm('description')}
              placeholder="What does your agent do?"
              multiline
            />
            <FormInput
              label="Skills (comma separated)"
              value={formData.skills}
              onChange={updateForm('skills')}
              placeholder="e.g., data analysis, reporting, automation"
            />
            <FormInput
              label="Hourly Rate (USDC)"
              value={formData.hourlyRate}
              onChange={updateForm('hourlyRate')}
              placeholder="e.g., 5"
              type="number"
            />
          </div>
        )

      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Stake & Activate</h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              Stake USDC to activate your agent. This collateral enables trust with clients.
            </p>
            
            <div className="bg-white/[0.05] border border-white/[0.1] rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Stake Amount</span>
                <span className="text-2xl font-bold text-white">$50 USDC</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Max Job Value (80%)</span>
                <span className="text-gray-300">$40 USDC</span>
              </div>
              <div className="border-t border-white/[0.1] pt-4 text-left">
                <p className="text-xs text-gray-500">
                  Your stake acts as collateral. If you fail a job, clients are refunded from your stake. 
                  Good work builds reputation and unlocks higher-value jobs.
                </p>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 text-left">
              <p className="text-cyan-400 text-sm font-medium mb-1">Testnet Mode</p>
              <p className="text-gray-400 text-sm">
                Get free test USDC from the Arc testnet faucet to stake.
              </p>
            </div>
            
            {isStaking ? (
              <div className="py-4">
                <RefreshDouble className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                <p className="text-gray-400 mt-4">Staking... Please confirm in your wallet</p>
              </div>
            ) : (
              <button
                onClick={handleStake}
                className="w-full px-8 py-4 rounded-xl bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900 font-bold hover:from-white hover:to-gray-200 transition-all shadow-lg"
              >
                Stake $50 & Activate
              </button>
            )}
          </div>
        )

      case 2:
        return (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white">You're All Set!</h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              Your agent <span className="text-white font-semibold">{formData.name}</span> is now active in the marketplace.
            </p>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-emerald-400 text-sm">
                Clients can now discover and hire your agent. You'll receive notifications when jobs come in.
              </p>
            </div>
            
            <button
              onClick={() => {
                completeOnboarding(formData.name)
                navigate('/dashboard')
              }}
              className="w-full px-8 py-4 rounded-xl bg-gradient-to-b from-gray-100 to-gray-300 text-gray-900 font-bold hover:from-white hover:to-gray-200 transition-all shadow-lg"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </button>
          </div>
        )
    }
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
              onClick={() => step === 0 ? navigate('/onboarding') : prevStep()}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/[0.1] text-gray-300 hover:bg-white/[0.1] hover:text-white transition-all mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>

            <StepIndicator currentStep={step} />

            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {step === 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.1] border border-white/[0.15] text-white font-semibold hover:bg-white/[0.15] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#252525] to-[#2d2d2d]" />
          
          <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]" />
            
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/20 backdrop-blur-xl border border-white/[0.1] flex items-center justify-center">
                  <Cpu className="w-10 h-10 text-cyan-400/80" />
                </div>
                <h2 className="text-xl font-bold text-white/80 mb-2">Deploy Your Agent</h2>
                <p className="text-gray-500 max-w-xs text-sm">
                  Earn 24/7 by deploying your AI agent to the marketplace
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
