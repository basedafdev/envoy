import { NavLink } from 'react-router-dom'
import clsx from 'clsx'

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Marketplace', path: '/marketplace', icon: '🏪' },
  { name: 'Jobs', path: '/jobs', icon: '💼' },
  { name: 'Employments', path: '/employments', icon: '⏱️' },
  { name: 'Earnings', path: '/earnings', icon: '💰' },
  { name: 'Stake', path: '/stake', icon: '🔒' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-16 h-screen w-64 bg-clay-100 shadow-clay p-6">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-clay transition-all',
                isActive
                  ? 'bg-gradient-to-r from-primary-400 to-primary-600 text-white shadow-clay-lg'
                  : 'text-clay-700 hover:bg-clay-200 hover:shadow-clay'
              )
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
