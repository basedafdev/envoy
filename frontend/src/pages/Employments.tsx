import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Clock,
  CheckCircle,
  Wallet,
  Cpu,
  Calendar,
  Timer,
  ChatBubble,
  PlaySolid,
  PauseSolid
} from 'iconoir-react'

type EmploymentStatus = 'active' | 'paused' | 'completed' | 'cancelled'

interface Employment {
  id: string
  agentName: string
  serviceName: string
  status: EmploymentStatus
  ratePerHour: number
  totalBudget: number
  hoursWorked: number
  startedAt: string
  lastActivity: string
  lastMessage: string
}

const mockEmployments: Employment[] = [
  {
    id: '1',
    agentName: 'DevOps Assistant',
    serviceName: 'Infrastructure Monitoring',
    status: 'active',
    ratePerHour: 5,
    totalBudget: 500,
    hoursWorked: 72.5,
    startedAt: '2024-01-15',
    lastActivity: '2 min ago',
    lastMessage: 'All systems operational. CPU usage at 23%, no anomalies detected.',
  },
  {
    id: '2',
    agentName: 'ContentWriter AI',
    serviceName: 'Social Media Management',
    status: 'active',
    ratePerHour: 3,
    totalBudget: 300,
    hoursWorked: 45.2,
    startedAt: '2024-01-20',
    lastActivity: '15 min ago',
    lastMessage: 'Posted daily update to Twitter. Engagement is up 12% this week.',
  },
  {
    id: '3',
    agentName: 'Security Auditor',
    serviceName: 'Continuous Security Watch',
    status: 'paused',
    ratePerHour: 15,
    totalBudget: 1000,
    hoursWorked: 28.0,
    startedAt: '2024-01-10',
    lastActivity: '3 days ago',
    lastMessage: 'Employment paused by client. Resume anytime to continue monitoring.',
  },
  {
    id: '4',
    agentName: 'DataAnalyzer',
    serviceName: 'Real-time Analytics',
    status: 'completed',
    ratePerHour: 8,
    totalBudget: 400,
    hoursWorked: 50.0,
    startedAt: '2024-01-01',
    lastActivity: '1 week ago',
    lastMessage: 'Employment completed. Final analytics report delivered.',
  },
  {
    id: '5',
    agentName: 'API Builder',
    serviceName: 'API Maintenance & Support',
    status: 'active',
    ratePerHour: 10,
    totalBudget: 800,
    hoursWorked: 32.8,
    startedAt: '2024-01-25',
    lastActivity: '1 hour ago',
    lastMessage: 'Fixed rate limiting issue. API response times improved by 40%.',
  },
]

const statusFilters = ['All', 'Active', 'Paused', 'Completed', 'Cancelled'] as const

const statusConfig: Record<EmploymentStatus, { label: string; bgClass: string; textClass: string; dotClass: string; icon: typeof PlaySolid }> = {
  active: {
    label: 'Active',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    dotClass: 'bg-emerald-400',
    icon: PlaySolid,
  },
  paused: {
    label: 'Paused',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    dotClass: 'bg-amber-400',
    icon: PauseSolid,
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400',
    dotClass: 'bg-cyan-400',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bgClass: 'bg-gray-500/20',
    textClass: 'text-gray-400',
    dotClass: 'bg-gray-400',
    icon: Clock,
  },
}

function EmploymentCard({ employment }: { employment: Employment }) {
  const status = statusConfig[employment.status]
  const spent = employment.hoursWorked * employment.ratePerHour
  const remaining = employment.totalBudget - spent
  const progress = (spent / employment.totalBudget) * 100

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{employment.agentName}</p>
              <p className="text-xs text-gray-500">${employment.ratePerHour}/hour</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${status.bgClass} ${status.textClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
            {status.label}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-3">{employment.serviceName}</h3>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Budget Used</span>
            <span className="text-white">${spent.toFixed(0)} / ${employment.totalBudget}</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4" />
            <span>{employment.hoursWorked}h worked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{employment.lastActivity}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] mb-4">
          <div className="flex items-start gap-2">
            <ChatBubble className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-400 line-clamp-2">{employment.lastMessage}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div>
            <span className="text-sm text-gray-500">Remaining: </span>
            <span className="text-lg font-bold text-white">${remaining.toFixed(0)}</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm transition-all">
            <ChatBubble className="w-4 h-4" />
            Chat
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Employments() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<typeof statusFilters[number]>('All')

  const filteredEmployments = mockEmployments.filter(emp => {
    const matchesSearch = 
      emp.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      selectedFilter === 'All' || 
      emp.status === selectedFilter.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  const activeEmployments = mockEmployments.filter(e => e.status === 'active')
  const stats = {
    total: mockEmployments.length,
    active: activeEmployments.length,
    totalHours: mockEmployments.reduce((sum, e) => sum + e.hoursWorked, 0),
    totalSpent: mockEmployments.reduce((sum, e) => sum + (e.hoursWorked * e.ratePerHour), 0),
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#2d2d2d]"
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a3a3a] via-[#2d2d2d] to-[#252525]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-2">
            Employments
          </h1>
          <p className="text-gray-400">Manage your continuous employment contracts</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Contracts</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <PlaySolid className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Timer className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalHours.toFixed(0)}h</p>
                <p className="text-xs text-gray-500">Total Hours</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${stats.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-gray-500">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employments or agents..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedFilter === filter
                  ? 'bg-white/[0.15] text-white border border-white/[0.2]'
                  : 'bg-white/[0.04] text-gray-400 border border-transparent hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {filteredEmployments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No employments found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchQuery || selectedFilter !== 'All' 
                ? 'Try adjusting your search or filters'
                : 'Your continuous employment contracts will appear here. Rent an agent for ongoing work via chat-based interaction.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployments.map((employment) => (
              <EmploymentCard key={employment.id} employment={employment} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
