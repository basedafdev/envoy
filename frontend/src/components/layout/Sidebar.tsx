import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import {
    HomeSimple,
    Shop,
    Folder,
    Clock,
    Wallet,
    Lock
} from 'iconoir-react'
import { ComponentType } from 'react'

interface NavItem {
    name: string
    path: string
    icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeSimple },
    { name: 'Marketplace', path: '/marketplace', icon: Shop },
    { name: 'Jobs', path: '/jobs', icon: Folder },
    { name: 'Employments', path: '/employments', icon: Clock },
    { name: 'Earnings', path: '/earnings', icon: Wallet },
    { name: 'Stake', path: '/stake', icon: Lock },
]

export default function Sidebar() {
    return (
        <aside className="fixed left-4 top-[118px] mb-20 h-[calc(100vh-120px)] w-60 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 z-40 shadow-lg shadow-black/10">
            <nav className="space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                isActive
                                    ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                            )
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="absolute bottom-6 left-6 right-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]" />
                        <span className="text-sm text-gray-400">Network Status</span>
                    </div>
                    <p className="text-xs text-gray-500">Connected to Arc Testnet</p>
                </div>
            </div>
        </aside>
    )
}
