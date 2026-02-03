import clsx from 'clsx'
import { ButtonHTMLAttributes } from 'react'

interface ClayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary'
}

export default function ClayButton({
    children,
    className,
    variant = 'primary',
    ...props
}: ClayButtonProps) {
    return (
        <button
            className={clsx(
                'px-8 py-4 rounded-2xl font-bold transition-all duration-200 active:scale-95 active:shadow-clay-btn-active shadow-clay-btn',
                variant === 'primary' ? 'text-clay-primary' : 'text-clay-secondary',
                className
            )}
            {...props}
        >
            {children}
        </button>
    )
}
