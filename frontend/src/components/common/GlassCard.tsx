import clsx from 'clsx'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
    children: ReactNode
    className?: string
    noHover?: boolean
}

export default function GlassCard({ children, className, noHover = false }: GlassCardProps) {
    return (
        <motion.div
            whileHover={noHover ? undefined : { y: -3 }}
            transition={{ duration: 0.2 }}
            className={clsx(
                'relative overflow-hidden',
                'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]',
                'rounded-2xl shadow-lg shadow-black/20',
                className
            )}
        >
            <div className="relative z-10 p-6 h-full">
                {children}
            </div>
        </motion.div>
    )
}
