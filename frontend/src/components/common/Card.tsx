import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

export default function Card({ children, className, size = 'md', hoverable = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-clay-100 rounded-clay p-6',
        {
          'shadow-clay-sm': size === 'sm',
          'shadow-clay': size === 'md',
          'shadow-clay-lg': size === 'lg',
          'hover:shadow-clay-xl hover:-translate-y-0.5 cursor-pointer': hoverable,
        },
        className
      )}
    >
      {children}
    </div>
  )
}
