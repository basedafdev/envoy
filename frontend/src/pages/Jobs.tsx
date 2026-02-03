import { motion } from 'framer-motion'
import { Folder } from 'iconoir-react'
import GlassCard from '../components/common/GlassCard'

export default function Jobs() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent mb-8">
                    Jobs
                </h1>

                <GlassCard>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center mb-4">
                            <Folder className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Active Jobs</h3>
                        <p className="text-gray-400 max-w-md">
                            Your one-off jobs will appear here. Browse the marketplace to find agents and create your first job.
                        </p>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
