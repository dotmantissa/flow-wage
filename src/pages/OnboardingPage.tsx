import { BriefcaseBusiness, Check, UserRound, UsersRound } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { truncateAddress } from '@/lib/utils'

export function OnboardingPage({ canBeEmployer }: { canBeEmployer: boolean }) {
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const setPreferredMode = useAppStore((s) => s.setPreferredMode)
  const [wantEmployer, setWantEmployer] = useState(false)
  const [wantWorker, setWantWorker] = useState(true)

  const selectedLabel = useMemo(() => {
    if (wantEmployer && wantWorker) return 'Both roles'
    if (wantEmployer) return 'Employer only'
    if (wantWorker) return 'Worker only'
    return 'None selected'
  }, [wantEmployer, wantWorker])

  const continueOnboarding = () => {
    if (!wantEmployer && !wantWorker) {
      toast.error('Select at least one role to continue.')
      return
    }
    if (wantEmployer && wantWorker) {
      setPreferredMode('both')
      if (!canBeEmployer) {
        toast.message('Employer mode is saved. It will unlock once your wallet is activated as employer on-chain.')
      }
      return
    }
    if (wantEmployer) {
      if (!canBeEmployer) {
        setPreferredMode('both')
        toast.message('Employer preference saved. Worker mode opens now while employer mode unlocks after on-chain activation.')
        return
      }
      setPreferredMode('employer')
      return
    }
    setPreferredMode('worker')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <motion.div className="glass rounded-3xl p-8" initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.38 }}>
        <p className="text-xs uppercase tracking-[0.26em] text-[#C4B5FD]">Step 2 of 2 • Onboarding</p>
        <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Choose your registrations</h2>
        <p className="mt-3 text-sm text-muted-foreground">Wallet: {truncateAddress(address)}</p>
        <p className="mt-6 max-w-2xl text-base font-light text-muted-foreground">Select one or both roles to personalize your workspace. Worker mode is always available. Employer actions unlock once the wallet is active as employer on-chain.</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => { setWantEmployer(false); setWantWorker(true) }}>Worker only</button>
          <button className="btn-ghost" onClick={() => { setWantEmployer(true); setWantWorker(false) }}>Employer only</button>
          <button className="btn-ghost" onClick={() => { setWantEmployer(true); setWantWorker(true) }}>Both roles</button>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <motion.button
            whileHover={reduce ? undefined : { y: -6, scale: 1.01 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={`glass rounded-2xl p-5 text-left transition hover:shadow-[0_0_40px_rgba(124,58,237,0.32)] ${wantEmployer ? 'border border-[#A78BFA]/70' : ''}`}
            onClick={() => setWantEmployer((v) => !v)}
          >
            <div className="flex items-center justify-between gap-2 text-lg font-semibold">
              <span className="inline-flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5 text-[#A78BFA]" /> Employer
              </span>
              {wantEmployer ? <Check className="h-5 w-5 text-[#A78BFA]" /> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Create streams, manage payroll schedules, pause and resume salary flows.</p>
            {!canBeEmployer ? <p className="mt-2 text-xs text-amber-300">This wallet is not registered as an active employer on-chain.</p> : null}
          </motion.button>

          <motion.button
            whileHover={reduce ? undefined : { y: -6, scale: 1.01 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={`glass rounded-2xl p-5 text-left transition hover:shadow-[0_0_40px_rgba(124,58,237,0.32)] ${wantWorker ? 'border border-[#A78BFA]/70' : ''}`}
            onClick={() => setWantWorker((v) => !v)}
          >
            <div className="flex items-center justify-between gap-2 text-lg font-semibold">
              <span className="inline-flex items-center gap-2">
              <UserRound className="h-5 w-5 text-[#A78BFA]" /> Worker
              </span>
              {wantWorker ? <Check className="h-5 w-5 text-[#A78BFA]" /> : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Track streamed earnings in real time and withdraw available balances at will.</p>
          </motion.button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><UsersRound className="h-4 w-4 text-[#A78BFA]" /> Selected: <span className="text-foreground">{selectedLabel}</span></p>
          <motion.button whileHover={reduce ? undefined : { scale: 1.02 }} whileTap={reduce ? undefined : { scale: 0.98 }} className="btn-primary" onClick={continueOnboarding}>
            Continue to dashboard
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
