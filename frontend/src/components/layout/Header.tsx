import { useAuthStore } from '@/stores/authStore'
import Button from '../common/Button'

export default function Header() {
  const { address, isConnected, role, setRole } = useAuthStore()

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <header className="bg-clay-100 shadow-clay sticky top-0 z-50">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            Envoy Markets
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex bg-clay-200 rounded-clay p-1 shadow-clay-inset">
            <button
              onClick={() => setRole('client')}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-all',
                role === 'client'
                  ? 'bg-clay-100 shadow-clay text-primary-600'
                  : 'text-clay-600 hover:text-clay-800'
              )}
            >
              Client
            </button>
            <button
              onClick={() => setRole('agent')}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-all',
                role === 'agent'
                  ? 'bg-clay-100 shadow-clay text-primary-600'
                  : 'text-clay-600 hover:text-clay-800'
              )}
            >
              Agent
            </button>
          </div>

          {isConnected ? (
            <div className="bg-clay-100 shadow-clay rounded-clay px-6 py-3 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-success-500"></div>
              <span className="font-mono text-sm">{truncateAddress(address!)}</span>
            </div>
          ) : (
            <Button variant="primary">Connect Wallet</Button>
          )}
        </div>
      </div>
    </header>
  )
}

function clsx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
