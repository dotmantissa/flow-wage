import { useAccount } from 'wagmi'
import { motion, useReducedMotion } from 'framer-motion'
import { AppHeader } from '@/components/layout/AppHeader'
import { useGetVault } from '@/hooks/useFlowWageFactory'
import { useAppStore } from '@/store/useAppStore'
import { DeployVaultCard } from '@/pages/employer/DeployVaultCard'
import { StatsRow } from '@/pages/employer/StatsRow'
import { CreateStreamForm } from '@/pages/employer/CreateStreamForm'
import { StreamsTable } from '@/pages/employer/StreamsTable'

export function EmployerDashboard() {
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const userRole = useAppStore((s) => s.userRole)
  const preferredMode = useAppStore((s) => s.preferredMode)
  const setPreferredMode = useAppStore((s) => s.setPreferredMode)
  const storeVault = useAppStore((s) => s.vaultAddress)
  const setVaultAddress = useAppStore((s) => s.setVaultAddress)
  const vaultRead = useGetVault(address)

  const vault = ((vaultRead.data as `0x${string}` | undefined) || storeVault) as `0x${string}` | null
  if (vault && vault !== storeVault) setVaultAddress(vault)

  return (
    <div id="overview">
      <AppHeader role="Employer" />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.35 }}>
          <h1 className="text-3xl font-semibold md:text-4xl">Employer command center</h1>
          <p className="mt-2 text-sm text-muted-foreground">Fund streams, monitor payouts, and manage payroll state in real time.</p>
        </motion.div>

        {!vault ? <div className="scroll-mt-28"><DeployVaultCard onDeployed={() => vaultRead.refetch()} /></div> : null}
        {vault ? (
          <>
            <StatsRow vault={vault} />
            <CreateStreamForm vault={vault} />
          </>
        ) : null}

        <section id="streams" className="scroll-mt-28">
          {vault ? <StreamsTable vault={vault} /> : <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">Deploy your vault to start creating streams.</div>}
        </section>

        <section id="security" className="glass scroll-mt-28 rounded-2xl p-5 text-sm text-muted-foreground">
          <p>Security: all payroll actions require explicit wallet signatures and execute on HashKey testnet.</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-[var(--bg-raise)] p-3">
            <p className="text-sm font-medium text-foreground">Dashboard settings</p>
            <p className="mt-1 text-xs">Primary role persists for this wallet across future connections.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={`btn-ghost ${preferredMode === 'employer' ? 'border-[var(--purple)]' : ''}`} onClick={() => setPreferredMode('employer')}>Employer</button>
              <button type="button" className={`btn-ghost ${preferredMode === 'both' ? 'border-[var(--purple)]' : ''}`} onClick={() => setPreferredMode('both')}>Enable Both Roles</button>
              <button type="button" className={`btn-ghost ${preferredMode === 'worker' ? 'border-[var(--purple)]' : ''}`} onClick={() => setPreferredMode('worker')}>Worker View</button>
            </div>
            {!userRole?.isEmployer ? <p className="mt-2 text-xs text-amber-300">Employer tools appear once your wallet is active as employer on-chain.</p> : null}
          </div>
        </section>
      </main>
    </div>
  )
}
