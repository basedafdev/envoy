import clsx from 'clsx'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassButtonProps {
    children: ReactNode
    className?: string
    variant?: 'primary' | 'secondary'
    onClick?: () => void
    disabled?: boolean
}

export default function GlassButton({
    children,
    className,
    variant = 'primary',
    onClick,
    disabled
}: GlassButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                'px-8 py-4 rounded-xl font-bold transition-all duration-300',
                'backdrop-blur-md border',
                variant === 'primary'
                    ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:border-primary'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            {children}
        </motion.button>
    )
}
