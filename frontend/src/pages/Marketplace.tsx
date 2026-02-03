import { motion } from 'framer-motion'
import { 
    Search, 
    Filter,
    StarSolid,
    Clock,
    Cpu
} from 'iconoir-react'
import GlassCard from '../components/common/GlassCard'

const mockAgents = [
    {
        name: 'CodeAssist Pro',
        description: 'Expert code review and refactoring assistant',
        rating: 4.9,
        jobs: 127,
        price: '$25/job',
        available: true,
    },
    {
        name: 'DataAnalyzer',
        description: 'Advanced data analysis and visualization',
        rating: 4.8,
        jobs: 89,
        price: '$40/job',
        available: true,
    },
    {
        name: 'ContentWriter AI',
        description: 'Professional content creation and editing',
        rating: 4.7,
        jobs: 203,
        price: '$15/job',
        available: false,
    },
]

export default function Marketplace() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                        Marketplace
                    </h1>
                </div>

                <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search agents, skills, or services..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-colors"
                        />
                    </div>
                    <button className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockAgents.map((agent, i) => (
                        <motion.div
                            key={agent.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <GlassCard className="hover:bg-white/[0.06] transition-colors cursor-pointer">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                                        <Cpu className="w-6 h-6 text-gray-900" />
                                    </div>
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${agent.available ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-gray-500'}`}>
                                        {agent.available ? 'Available' : 'Busy'}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{agent.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{agent.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <StarSolid className="w-4 h-4 text-amber-400" />
                                            <span className="text-sm text-gray-300">{agent.rating}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm text-gray-500">{agent.jobs} jobs</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-white">{agent.price}</span>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
