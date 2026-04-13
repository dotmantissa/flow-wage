import { Loader2 } from 'lucide-react'
import { useConnect } from 'wagmi'
import { useAppStore } from '@/store/useAppStore'

export function ConnectWalletPage() {
  const { connect, connectors, isPending, error } = useConnect()
  const setDemoMode = useAppStore((s) => s.setDemoMode)

  const connector = connectors.find((c) => c.name.toLowerCase().includes('metamask')) ?? connectors[0]

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 text-center">
        <h1 className="font-mono text-5xl md:text-7xl">Flow <span className="text-primary">|</span> WAGE</h1>
        <p className="mt-3 text-sm text-muted-foreground">Stream wages. Withdraw anytime.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="rounded-full border px-3 py-1">169M workers</span>
          <span className="rounded-full border px-3 py-1">6-8% saved</span>
          <span className="rounded-full border px-3 py-1">Real-time</span>
        </div>
        <div className="mt-8 w-full max-w-md rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Connect Your Wallet</h2>
          <button
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            disabled={isPending || !connector}
            onClick={() => connector && connect({ connector })}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Connect MetaMask
          </button>
          {error ? <p className="mt-2 text-sm text-destructive">{error.message}</p> : null}
          <button className="mt-4 text-sm text-amber-300 underline" onClick={() => setDemoMode(true)}>
            Explore demo without wallet
          </button>
        </div>
      </div>
    </div>
  )
}
