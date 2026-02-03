import clsx from 'clsx'
import { ReactNode } from 'react'

interface ClayCardProps {
    children: ReactNode
    className?: string
}

export default function ClayCard({ children, className }: ClayCardProps) {
    return (
        <div
            className={clsx(
                'bg-clay-card rounded-3xl p-8 shadow-clay-card transition-transform hover:-translate-y-1 duration-300',
                className
            )}
        >
            {children}
        </div>
    )
}
