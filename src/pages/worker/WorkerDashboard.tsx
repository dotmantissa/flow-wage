import { useAccount } from 'wagmi'
import { AppHeader } from '@/components/layout/AppHeader'
import { useAppStore } from '@/store/useAppStore'
import { VaultConnector } from '@/pages/worker/VaultConnector'
import { StreamCards } from '@/pages/worker/StreamCards'
import { EarningsHero } from '@/pages/worker/EarningsHero'
import { useEmployeeStreams } from '@/hooks/useStreamVault'

export function WorkerDashboard() {
  const { address } = useAccount()
  const vault = useAppStore((s) => s.vaultAddress)
  const streams = useEmployeeStreams(vault ?? undefined, address)
  const first = ((streams.data as bigint[] | undefined) ?? [])[0]

  return (
    <div>
      <AppHeader role="Worker" />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        {vault && first !== undefined ? <EarningsHero vault={vault} streamId={first} /> : null}
        {!vault ? <VaultConnector /> : null}
        {vault && address ? <StreamCards vault={vault} address={address} /> : null}
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Withdrawal history appears from explorer-linked events in production mode.</div>
      </main>
    </div>
  )
}
