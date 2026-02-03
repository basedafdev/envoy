import { ReactNode, ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'rounded-clay font-medium transition-all duration-200',
        {
          'bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-clay hover:shadow-clay-lg active:shadow-clay-inset':
            variant === 'primary',
          'bg-clay-100 text-clay-800 shadow-clay hover:shadow-clay-lg active:shadow-clay-inset':
            variant === 'secondary',
          'bg-transparent border-2 border-clay-300 text-clay-700 hover:border-primary-400 hover:text-primary-600':
            variant === 'outline',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
