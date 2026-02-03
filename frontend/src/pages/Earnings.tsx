import { motion } from 'framer-motion'
import { Wallet, GraphUp } from 'iconoir-react'
import GlassCard from '../components/common/GlassCard'

const stats = [
    { label: 'Total Earnings', value: '$0.00', icon: Wallet },
    { label: 'This Month', value: '$0.00', icon: GraphUp },
    { label: 'Pending', value: '$0.00', icon: Wallet },
]

export default function Earnings() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-8">
                    Earnings
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

                <GlassCard>
                    <h2 className="text-xl font-bold text-white mb-6">Earnings History</h2>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-gray-400">No earnings yet. Complete jobs to start earning.</p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
