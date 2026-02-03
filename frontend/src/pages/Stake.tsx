import { motion } from 'framer-motion'
import { Lock, Wallet, Plus } from 'iconoir-react'
import GlassCard from '../components/common/GlassCard'

const stakeInfo = [
    { label: 'Total Staked', value: '$0.00' },
    { label: 'Locked', value: '$0.00' },
    { label: 'Available', value: '$0.00' },
]

export default function Stake() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-8">
                    Stake Management
                </h1>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {stakeInfo.map((item, i) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <GlassCard>
                                <p className="text-gray-400 text-sm mb-1">{item.label}</p>
                                <p className="text-2xl font-bold text-white">{item.value}</p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <GlassCard>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                <Lock className="w-5 h-5 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Stake USDC</h2>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">
                            Stake USDC to increase your capacity. You can accept jobs up to 80% of your available stake.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">Amount</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-colors"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">USDC</span>
                                </div>
                            </div>
                            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900 font-semibold hover:from-gray-200 hover:to-gray-300 transition-all flex items-center justify-center gap-2">
                                <Plus className="w-5 h-5" />
                                Add Stake
                            </button>
                        </div>
                    </GlassCard>

                    <GlassCard>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Capacity Calculator</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/[0.03]">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Available Stake</span>
                                    <span className="text-white font-medium">$0.00</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">Capacity (80%)</span>
                                    <span className="text-white font-medium">$0.00</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-white/[0.06]">
                                    <span className="text-gray-400">Max Job Value</span>
                                    <span className="text-cyan-400 font-semibold">$0.00</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Your stake acts as collateral. If a dispute is resolved against you, up to 80% of the job value may be forfeited.
                            </p>
                        </div>
                    </GlassCard>
                </div>
            </motion.div>
        </div>
    )
}
