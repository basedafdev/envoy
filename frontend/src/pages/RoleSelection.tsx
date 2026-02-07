import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cpu, User, Wallet, Shield, GraphUp, Clock, Check, Copy } from 'iconoir-react'
import { useWalletStore } from '../stores/walletStore'
import { useAuthStore } from '../stores/authStore'
import { useState } from 'react'

type UserRole = 'agent' | 'client'

interface RoleCardProps {
  icon: React.ElementType
  title: string
  subtitle: string
  features: { icon: React.ElementType; text: string }[]
  onClick: () => void
  accent: string
}

function RoleCard({ icon: Icon, title, subtitle, features, onClick, accent }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#3a3a3a]/60 to-[#2a2a2a]/60 border border-white/[0.08] p-8 text-left transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:border-white/[0.15]"
    >
      <div className={`absolute top-0 right-0 w-48 h-48 ${accent} rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-5 shadow-lg">
          <Icon className="w-7 h-7 text-gray-900" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-5">{subtitle}</p>

        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-300">
              <feature.icon className="w-5 h-5 text-cyan-400" />
              <span className="text-sm">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>
    </button>
  )
}

export default function RoleSelection() {
  const navigate = useNavigate()
  const { circleWalletAddress, isRegistered, setUserType, hasCompletedOnboarding } = useWalletStore()
  const { setRole } = useAuthStore()
  const [copied, setCopied] = useState(false)

  if (!isRegistered || !circleWalletAddress) {
    navigate('/login')
    return null
  }

  if (hasCompletedOnboarding) {
    navigate('/dashboard')
    return null
  }

  const handleSelectRole = (role: UserRole) => {
    setUserType(role)
    setRole(role)
    navigate(role === 'agent' ? '/onboarding/agent' : '/onboarding/client')
  }

  const copyAddress = () => {
    if (circleWalletAddress) {
      navigator.clipboard.writeText(circleWalletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

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

      <div className="relative z-10 min-h-screen flex flex-col justify-center px-8 lg:px-12 xl:px-20 py-12">
        <div className="max-w-3xl mx-auto w-full">
          <div className="mb-8">
            <img src="/logo.png" alt="Envoy" className="h-10" />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-emerald-400 font-medium">Wallet Created</p>
                  <p className="text-sm text-gray-400">{truncateAddress(circleWalletAddress)}</p>
                </div>
              </div>
              <button
                onClick={copyAddress}
                className="p-2 rounded-lg bg-white/[0.1] hover:bg-white/[0.15] transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              How do you want to use Envoy?
            </span>
          </h1>

          <p className="text-lg text-gray-400 mb-8">
            You can switch between modes anytime from the dashboard
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <RoleCard
              icon={Cpu}
              title="Deploy Agent"
              subtitle="For AI developers & operators"
              features={[
                { icon: Wallet, text: 'Stake USDC as collateral' },
                { icon: GraphUp, text: 'Earn 24/7 from your AI' },
                { icon: Shield, text: 'Build on-chain reputation' },
              ]}
              onClick={() => handleSelectRole('agent')}
              accent="bg-cyan-500/20"
            />

            <RoleCard
              icon={User}
              title="Hire Agent"
              subtitle="For businesses & individuals"
              features={[
                { icon: Clock, text: 'Browse verified agents' },
                { icon: Wallet, text: 'Pay only for results' },
                { icon: Shield, text: 'Trustless escrow protection' },
              ]}
              onClick={() => handleSelectRole('client')}
              accent="bg-gray-400/20"
            />
          </div>

          <p className="mt-8 text-gray-500 text-sm text-center">
            Don't worry, you can always access both features. This just sets your default view.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
