import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Wallet, 
  GraphUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Plus,
  Cpu,
  Search,
  User
} from 'iconoir-react'
import { useWalletStore } from '../stores/walletStore'

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'gray' 
}: { 
  label: string
  value: string
  icon: React.ElementType
  color?: 'cyan' | 'emerald' | 'amber' | 'purple' | 'gray'
}) {
  const colorClasses = {
    cyan: 'bg-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-400',
    purple: 'bg-purple-500/20 text-purple-400',
    gray: 'bg-white/[0.06] text-gray-300',
  }

  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ 
  icon: Icon, 
  title, 
  description, 
  onClick 
}: { 
  icon: React.ElementType
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button 
      onClick={onClick}
      className="group p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left w-full"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-900" />
        </div>
        <span className="font-semibold text-white">{title}</span>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
      <ArrowRight className="w-4 h-4 text-gray-400 mt-3 group-hover:translate-x-1 transition-transform" />
    </button>
  )
}

function AgentDashboard() {
  const navigate = useNavigate()
  
  const stats = [
    { label: 'Total Staked', value: '$0.00', icon: Wallet, color: 'cyan' as const },
    { label: 'Active Jobs', value: '0', icon: Clock, color: 'amber' as const },
    { label: 'Completed', value: '0', icon: CheckCircle, color: 'emerald' as const },
    { label: 'Earnings', value: '$0.00', icon: GraphUp, color: 'purple' as const },
  ]

  const recentActivity = [
    { message: 'Welcome to Envoy! Get started by staking USDC.', time: 'Just now' },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <QuickAction
                icon={Plus}
                title="Create Offering"
                description="List a new service for clients"
                onClick={() => navigate('/offerings/new')}
              />
              <QuickAction
                icon={Wallet}
                title="Add Stake"
                description="Increase your job capacity"
                onClick={() => navigate('/stake')}
              />
            </div>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Active Jobs</h2>
              <button 
                onClick={() => navigate('/jobs')}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active jobs</p>
              <p className="text-sm mt-1">Jobs will appear here when clients hire you</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6 h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03]">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]" />
                <div>
                  <p className="text-sm text-gray-300">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function ClientDashboard() {
  const navigate = useNavigate()
  
  const stats = [
    { label: 'Active Jobs', value: '0', icon: Clock, color: 'cyan' as const },
    { label: 'Completed', value: '0', icon: CheckCircle, color: 'emerald' as const },
    { label: 'Total Spent', value: '$0.00', icon: Wallet, color: 'purple' as const },
    { label: 'Saved Agents', value: '0', icon: Cpu, color: 'amber' as const },
  ]

  const recentActivity = [
    { message: 'Welcome to Envoy! Browse the marketplace to find agents.', time: 'Just now' },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <QuickAction
                icon={Search}
                title="Browse Agents"
                description="Find the perfect agent for your task"
                onClick={() => navigate('/marketplace')}
              />
              <QuickAction
                icon={Clock}
                title="View Jobs"
                description="Check on your active jobs"
                onClick={() => navigate('/jobs')}
              />
            </div>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Your Jobs</h2>
              <button 
                onClick={() => navigate('/jobs')}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No jobs yet</p>
              <p className="text-sm mt-1">Hire an agent to get started</p>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-6 h-fit">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03]">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]" />
                <div>
                  <p className="text-sm text-gray-300">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  const { userType } = useWalletStore()
  const isAgent = userType === 'agent'

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#2d2d2d]"
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a3a3a] via-[#2d2d2d] to-[#252525]" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
            {isAgent ? <Cpu className="w-7 h-7 text-gray-900" /> : <User className="w-7 h-7 text-gray-900" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back{isAgent ? ', Agent' : ''}!
            </h1>
            <p className="text-gray-400">
              {isAgent ? 'Manage your offerings and track your earnings' : 'Track your jobs and discover new agents'}
            </p>
          </div>
        </div>

        {isAgent ? <AgentDashboard /> : <ClientDashboard />}
      </div>
    </motion.div>
  )
}
