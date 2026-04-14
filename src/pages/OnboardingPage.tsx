import { BriefcaseBusiness, UserRound } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useAppStore } from '@/store/useAppStore'
import { truncateAddress } from '@/lib/utils'

export function OnboardingPage({ canBeEmployer }: { canBeEmployer: boolean }) {
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const setPreferredMode = useAppStore((s) => s.setPreferredMode)

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <motion.div className="glass rounded-3xl p-8" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.38 }}>
        <p className="text-xs uppercase tracking-[0.26em] text-[#C4B5FD]">Onboarding</p>
        <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Choose your role</h2>
        <p className="mt-3 text-sm text-muted-foreground">Wallet: {truncateAddress(address)}</p>
        <p className="mt-6 max-w-2xl text-base font-light text-muted-foreground">Select your perspective. You can switch later by disconnecting and reconnecting.</p>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <motion.button
            whileHover={reduce ? undefined : { y: -6, scale: 1.01 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={`glass rounded-2xl p-5 text-left transition ${canBeEmployer ? 'hover:shadow-[0_0_40px_rgba(124,58,237,0.32)]' : 'cursor-not-allowed opacity-60'}`}
            onClick={() => canBeEmployer && setPreferredMode('employer')}
            disabled={!canBeEmployer}
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <BriefcaseBusiness className="h-5 w-5 text-[#A78BFA]" /> Employer
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Create streams, manage payroll schedules, pause and resume salary flows.</p>
            {!canBeEmployer ? <p className="mt-2 text-xs text-amber-300">This wallet is not registered as an active employer on-chain.</p> : null}
          </motion.button>

          <motion.button
            whileHover={reduce ? undefined : { y: -6, scale: 1.01 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className="glass rounded-2xl p-5 text-left transition hover:shadow-[0_0_40px_rgba(124,58,237,0.32)]"
            onClick={() => setPreferredMode('worker')}
          >
            <div className="flex items-center gap-2 text-lg font-semibold">
              <UserRound className="h-5 w-5 text-[#A78BFA]" /> Worker
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Track streamed earnings in real time and withdraw available balances at will.</p>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
