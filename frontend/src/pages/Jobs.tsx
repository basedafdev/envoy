import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Clock,
  CheckCircle,
  Wallet,
  Cpu,
  Calendar,
  Eye,
  Folder
} from 'iconoir-react'

type JobStatus = 'active' | 'submitted' | 'completed' | 'disputed'

interface Job {
  id: string
  agentName: string
  offeringName: string
  status: JobStatus
  price: number
  createdAt: string
  deadline: string
  description: string
}

const mockJobs: Job[] = [
  {
    id: '1',
    agentName: 'CodeAssist Pro',
    offeringName: 'Code Review & Refactoring',
    status: 'active',
    price: 75,
    createdAt: '2024-02-01',
    deadline: '2024-02-05',
    description: 'Review and refactor the authentication module for better security',
  },
  {
    id: '2',
    agentName: 'DataAnalyzer',
    offeringName: 'Data Pipeline Analysis',
    status: 'submitted',
    price: 150,
    createdAt: '2024-01-28',
    deadline: '2024-02-03',
    description: 'Analyze data pipeline bottlenecks and provide optimization report',
  },
  {
    id: '3',
    agentName: 'ContentWriter AI',
    offeringName: 'Technical Documentation',
    status: 'completed',
    price: 45,
    createdAt: '2024-01-20',
    deadline: '2024-01-25',
    description: 'Write comprehensive API documentation for the payments module',
  },
  {
    id: '4',
    agentName: 'Security Auditor',
    offeringName: 'Smart Contract Audit',
    status: 'disputed',
    price: 500,
    createdAt: '2024-01-15',
    deadline: '2024-01-22',
    description: 'Full security audit of staking contract with vulnerability report',
  },
  {
    id: '5',
    agentName: 'DevOps Assistant',
    offeringName: 'CI/CD Pipeline Setup',
    status: 'completed',
    price: 200,
    createdAt: '2024-01-10',
    deadline: '2024-01-15',
    description: 'Set up automated testing and deployment pipeline with GitHub Actions',
  },
  {
    id: '6',
    agentName: 'API Builder',
    offeringName: 'GraphQL API Design',
    status: 'active',
    price: 125,
    createdAt: '2024-02-02',
    deadline: '2024-02-08',
    description: 'Design and implement GraphQL schema for marketplace queries',
  },
]

const statusFilters = ['All', 'Active', 'Submitted', 'Completed', 'Disputed'] as const

const statusConfig: Record<JobStatus, { label: string; bgClass: string; textClass: string; dotClass: string }> = {
  active: {
    label: 'In Progress',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-400',
    dotClass: 'bg-cyan-400',
  },
  submitted: {
    label: 'Awaiting Review',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-400',
    dotClass: 'bg-amber-400',
  },
  completed: {
    label: 'Completed',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
    dotClass: 'bg-emerald-400',
  },
  disputed: {
    label: 'Disputed',
    bgClass: 'bg-red-500/20',
    textClass: 'text-red-400',
    dotClass: 'bg-red-400',
  },
}

function getTimeRemaining(deadline: string): string {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate.getTime() - now.getTime()
  
  if (diff < 0) return 'Overdue'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h left`
  return 'Due soon'
}

function JobCard({ job }: { job: Job }) {
  const status = statusConfig[job.status]
  const showTimeRemaining = job.status === 'active'

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-gray-900" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{job.agentName}</p>
              <p className="text-xs text-gray-500">Agent</p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${status.bgClass} ${status.textClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
            {status.label}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{job.offeringName}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{job.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
          {showTimeRemaining && (
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Clock className="w-4 h-4" />
              <span>{getTimeRemaining(job.deadline)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="text-left">
            <span className="text-lg font-bold text-white">${job.price}</span>
            <span className="text-xs text-gray-500 ml-1">USDC</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white text-sm transition-all">
            <Eye className="w-4 h-4" />
            View
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<typeof statusFilters[number]>('All')

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = 
      job.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.offeringName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      selectedFilter === 'All' || 
      job.status === selectedFilter.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  const stats = {
    total: mockJobs.length,
    active: mockJobs.filter(j => j.status === 'active').length,
    completed: mockJobs.filter(j => j.status === 'completed').length,
    totalSpent: mockJobs.filter(j => j.status === 'completed').reduce((sum, j) => sum + j.price, 0),
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
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-2">
            Jobs
          </h1>
          <p className="text-gray-400">Track and manage your one-off jobs</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Folder className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Jobs</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">${stats.totalSpent}</p>
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
              placeholder="Search jobs, agents, or descriptions..."
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

        {filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchQuery || selectedFilter !== 'All' 
                ? 'Try adjusting your search or filters'
                : 'Your one-off jobs will appear here. Browse the marketplace to find agents and create your first job.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
