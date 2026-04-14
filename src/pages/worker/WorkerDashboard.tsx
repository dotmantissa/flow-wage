import { useAccount } from 'wagmi'
import { motion, useReducedMotion } from 'framer-motion'
import { AppHeader } from '@/components/layout/AppHeader'
import { useAppStore } from '@/store/useAppStore'
import { VaultConnector } from '@/pages/worker/VaultConnector'
import { StreamCards } from '@/pages/worker/StreamCards'
import { EarningsHero } from '@/pages/worker/EarningsHero'
import { useEmployeeStreams } from '@/hooks/useStreamVault'

export function WorkerDashboard() {
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const vault = useAppStore((s) => s.vaultAddress)
  const streams = useEmployeeStreams(vault ?? undefined, address)
  const first = ((streams.data as bigint[] | undefined) ?? [])[0]

  return (
    <div id="overview">
      <AppHeader role="Worker" />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.35 }}>
          <h1 className="text-3xl font-semibold md:text-4xl">Worker earnings cockpit</h1>
          <p className="mt-2 text-sm text-muted-foreground">Track claimable income, connect your vault, and withdraw in one tap.</p>
        </motion.div>

        {vault && first !== undefined ? <EarningsHero vault={vault} streamId={first} /> : null}
        {!vault ? <VaultConnector /> : null}
        <div id="streams">{vault && address ? <StreamCards vault={vault} address={address} /> : null}</div>
        <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">Withdrawal history appears from explorer-linked events in production mode.</div>
      </main>
    </div>
  )
}
