import { useAccount, useDisconnect } from 'wagmi'
import { truncateAddress } from '@/lib/utils'

type Props = { role: 'Employer' | 'Worker' }

export function AppHeader({ role }: Props) {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="font-mono text-lg">Flow <span className="text-primary">|</span> WAGE</div>
        <div className="hidden items-center gap-2 rounded-full border px-3 py-1 text-xs md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> HashKey Testnet
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-2 py-1 text-xs">{truncateAddress(address)}</span>
          <span className="rounded-full bg-secondary px-2 py-1 text-xs">{role}</span>
          <button className="rounded-md border px-3 py-1 text-xs" onClick={() => disconnect()}>
            Disconnect
          </button>
        </div>
      </div>
    </header>
  )
}
