import { useAuthStore } from '@/stores/authStore'
import clsx from 'clsx'

export default function Header() {
    const { address, isConnected, role, setRole } = useAuthStore()

    const truncateAddress = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`

    return (
        <header className="fixed top-4 left-4 right-4 z-50">
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-lg shadow-black/10">
                <div className="flex items-center gap-3">
                    <img src="/logo.jpeg" alt="Envoy" className="h-10 w-auto" />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white/[0.04] rounded-xl p-1 border border-white/[0.08]">
                        <button
                            onClick={() => setRole('client')}
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
                            onClick={() => setRole('agent')}
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

                    {isConnected ? (
                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]" />
                            <span className="font-mono text-sm text-gray-300">{truncateAddress(address!)}</span>
                        </div>
                    ) : (
                        <button className="px-5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.12] text-white font-semibold hover:bg-white/[0.12] transition-all">
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </header>
    )
}
