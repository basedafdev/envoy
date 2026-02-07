import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useWalletStore } from '@/stores/walletStore'
import { useCircleWallet } from '@/hooks/useCircleWallet'
import { LogOut, NavArrowDown, Copy, Check } from 'iconoir-react'
import clsx from 'clsx'

export default function Header() {
    const navigate = useNavigate()
    const { address, role, setRole, disconnect } = useAuthStore()
    const { setUserType, circleWalletAddress, circleSession, clearWallet } = useWalletStore()
    const { signOut: signOutCircle } = useCircleWallet()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    const isLoggedIn = !!circleSession || !!circleWalletAddress
    
    const handleRoleChange = (newRole: 'client' | 'agent') => {
        setRole(newRole)
        setUserType(newRole)
    }
    
    const displayAddress = circleWalletAddress || address

    const truncateAddress = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`

    const handleSignOut = () => {
        signOutCircle()
        disconnect()
        clearWallet()
        setDropdownOpen(false)
        navigate('/')
    }

    const handleCopyAddress = async () => {
        if (displayAddress) {
            await navigator.clipboard.writeText(displayAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="fixed top-4 left-4 right-4 z-50">
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg shadow-black/10">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Envoy" className="h-10 w-auto" />
                </div>

                <div className="flex items-center gap-4">
                    {isLoggedIn && (
                        <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.08]">
                            <button
                                onClick={() => handleRoleChange('client')}
                                className={clsx(
                                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                                    role === 'client'
                                        ? 'bg-white/[0.12] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                                )}
                            >
                                Client
                            </button>
                            <button
                                onClick={() => handleRoleChange('agent')}
                                className={clsx(
                                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                                    role === 'agent'
                                        ? 'bg-white/[0.12] text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                                )}
                            >
                                Agent
                            </button>
                        </div>
                    )}

                    {isLoggedIn && displayAddress ? (
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-white/[0.06] transition-all"
                            >
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]" />
                                <span className="font-mono text-sm text-gray-300">{truncateAddress(displayAddress)}</span>
                                <NavArrowDown className={clsx(
                                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                                    dropdownOpen && "rotate-180"
                                )} />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-[#2a2a2a] border border-white/[0.1] rounded-xl shadow-xl shadow-black/30 overflow-hidden">
                                    <div className="p-3 border-b border-white/[0.08]">
                                        <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                                        <button 
                                            onClick={handleCopyAddress}
                                            className="flex items-center gap-2 w-full text-left group"
                                        >
                                            <span className="font-mono text-sm text-gray-300 truncate flex-1">
                                                {displayAddress}
                                            </span>
                                            {copied ? (
                                                <Check className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="p-1">
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span className="text-sm font-medium">Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button 
                            onClick={() => navigate('/')}
                            className="px-5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white font-semibold hover:bg-white/[0.12] transition-all"
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
