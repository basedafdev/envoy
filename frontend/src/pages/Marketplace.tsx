import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter,
  StarSolid,
  Cpu,
  Wallet,
  Check
} from 'iconoir-react'

const categories = ['All', 'Development', 'Data', 'Content', 'DevOps', 'Security']

const mockAgents = [
  {
    id: '1',
    name: 'CodeAssist Pro',
    description: 'Expert code review and refactoring assistant. Specializes in TypeScript, React, and Node.js.',
    skills: ['Code Review', 'TypeScript', 'React'],
    rating: 4.9,
    jobsCompleted: 127,
    price: 25,
    totalStaked: 5000,
    isActive: true,
  },
  {
    id: '2',
    name: 'DataAnalyzer',
    description: 'Advanced data analysis and visualization. Transform raw data into actionable insights.',
    skills: ['Data Analysis', 'Python', 'ML'],
    rating: 4.8,
    jobsCompleted: 89,
    price: 50,
    totalStaked: 8000,
    isActive: true,
  },
  {
    id: '3',
    name: 'ContentWriter AI',
    description: 'Professional content creation and editing. Blog posts, docs, and marketing copy.',
    skills: ['Writing', 'SEO', 'Editing'],
    rating: 4.7,
    jobsCompleted: 203,
    price: 15,
    totalStaked: 3000,
    isActive: false,
  },
  {
    id: '4',
    name: 'DevOps Assistant',
    description: 'CI/CD pipeline setup, cloud infrastructure, and deployment automation.',
    skills: ['DevOps', 'AWS', 'Docker'],
    rating: 4.95,
    jobsCompleted: 56,
    price: 100,
    totalStaked: 10000,
    isActive: true,
  },
  {
    id: '5',
    name: 'Security Auditor',
    description: 'Smart contract auditing and security vulnerability assessment.',
    skills: ['Security', 'Solidity', 'Auditing'],
    rating: 4.85,
    jobsCompleted: 34,
    price: 500,
    totalStaked: 15000,
    isActive: true,
  },
  {
    id: '6',
    name: 'API Builder',
    description: 'RESTful and GraphQL API design and implementation.',
    skills: ['API Design', 'Node.js', 'GraphQL'],
    rating: 4.75,
    jobsCompleted: 78,
    price: 75,
    totalStaked: 6000,
    isActive: true,
  },
]

function AgentCard({ agent }: { agent: typeof mockAgents[0] }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-6 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 cursor-pointer">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
            <Cpu className="w-6 h-6 text-gray-900" />
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            agent.isActive 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-white/[0.06] text-gray-500'
          }`}>
            {agent.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            {agent.isActive ? 'Available' : 'Busy'}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{agent.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {agent.skills.slice(0, 3).map((skill) => (
            <span 
              key={skill} 
              className="px-2 py-1 rounded-lg bg-white/[0.06] text-xs text-gray-300"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <StarSolid className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-gray-300">{agent.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">{agent.jobsCompleted}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white">${agent.price}</span>
            <span className="text-xs text-gray-500 ml-1">/ job</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || 
      agent.skills.some(s => s.toLowerCase().includes(selectedCategory.toLowerCase()))
    const matchesAvailable = !showAvailableOnly || agent.isActive
    return matchesSearch && matchesCategory && matchesAvailable
  })

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
            Marketplace
          </h1>
          <p className="text-gray-400">Discover and hire AI agents for your tasks</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mockAgents.length}</p>
                <p className="text-xs text-gray-500">Total Agents</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mockAgents.filter(a => a.isActive).length}</p>
                <p className="text-xs text-gray-500">Available Now</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <StarSolid className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">4.8</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
            </div>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">$47K</p>
                <p className="text-xs text-gray-500">Total Staked</p>
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
              placeholder="Search agents, skills, or services..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>
          <button 
            onClick={() => setShowAvailableOnly(!showAvailableOnly)}
            className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
              showAvailableOnly 
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' 
                : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Filter className="w-5 h-5" />
            Available Only
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-white/[0.15] text-white border border-white/[0.2]'
                  : 'bg-white/[0.04] text-gray-400 border border-transparent hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <Cpu className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
