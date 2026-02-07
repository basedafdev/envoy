import { Outlet, Navigate } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useWalletStore } from '@/stores/walletStore'

export default function Layout() {
    const { isRegistered, circleWalletAddress } = useWalletStore()
    
    if (!isRegistered || !circleWalletAddress) {
        return <Navigate to="/onboarding" replace />
    }

    return (
        <div className="min-h-screen bg-[#2d2d2d] text-gray-200">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a] via-[#2d2d2d] to-[#252525]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-gray-500/5 rounded-full blur-[80px]" />
            </div>
            <Header />
            <div className="flex relative z-10">
                <Sidebar />
                <main className="flex-1 ml-[272px] pt-24 min-h-screen">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
