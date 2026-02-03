import { motion } from 'framer-motion'
import { 
    Wallet, 
    GraphUp, 
    Clock, 
    CheckCircle,
    ArrowRight,
    Plus
} from 'iconoir-react'
import GlassCard from '../components/common/GlassCard'

const stats = [
    { label: 'Total Staked', value: '$0.00', icon: Wallet, change: null },
    { label: 'Active Jobs', value: '0', icon: Clock, change: null },
    { label: 'Completed', value: '0', icon: CheckCircle, change: null },
    { label: 'Earnings', value: '$0.00', icon: GraphUp, change: null },
]

const recentActivity = [
    { type: 'info', message: 'Welcome to Envoy! Get started by staking USDC.', time: 'Just now' },
]

export default function Dashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-8">
                    Dashboard
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <GlassCard>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                        <stat.icon className="w-5 h-5 text-gray-300" />
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <GlassCard>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">Quick Actions</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <button className="group p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                                                <Plus className="w-5 h-5 text-gray-900" />
                                            </div>
                                            <span className="font-semibold text-white">Create Offering</span>
                                        </div>
                                        <p className="text-sm text-gray-400">List a new service for clients</p>
                                        <ArrowRight className="w-4 h-4 text-gray-400 mt-3 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button className="group p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                                                <Wallet className="w-5 h-5 text-gray-900" />
                                            </div>
                                            <span className="font-semibold text-white">Add Stake</span>
                                        </div>
                                        <p className="text-sm text-gray-400">Increase your capacity</p>
                                        <ArrowRight className="w-4 h-4 text-gray-400 mt-3 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <GlassCard className="h-full">
                            <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
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
                        </GlassCard>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
