import { AlertTriangle, Loader2 } from 'lucide-react'
import { useNetworkGuard } from '@/hooks/useNetworkGuard'

export function WrongNetworkPage() {
  const { currentChainId, switchToHashKey, isSwitching } = useNetworkGuard()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <AlertTriangle className="text-amber-400" /> Wrong Network
        </div>
        <p className="mt-2 text-muted-foreground">Current chain ID: {currentChainId}</p>
        <button className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => switchToHashKey()}>
          {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Switch to HashKey Chain Testnet
        </button>
        <div className="mt-6 rounded-lg border p-4 text-sm">
          <p>Network Name: HashKey Chain Testnet</p>
          <p>RPC: https://testnet.hsk.xyz</p>
          <p>Chain ID: 133</p>
          <p>Native Token: HSK</p>
          <a className="text-primary underline" href="https://testnet-explorer.hsk.xyz" target="_blank" rel="noreferrer">Explorer</a>
        </div>
      </div>
    </div>
  )
}
