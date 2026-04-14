import { Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useConnect } from 'wagmi'
import { useAppStore } from '@/store/useAppStore'

export function ConnectWalletPage() {
  const reduce = useReducedMotion()
  const { connect, connectors, isPending, error } = useConnect()
  const setDemoMode = useAppStore((s) => s.setDemoMode)

  const connector = connectors.find((c) => c.name.toLowerCase().includes('metamask')) ?? connectors[0]
  const words = ['Stream', 'wages.', 'Withdraw', 'anytime.']

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mesh-grid" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-between px-4 pb-8 pt-5">
        <motion.nav
          initial={reduce ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.35 }}
          className="glass flex items-center justify-between rounded-full px-4 py-3"
        >
          <div className="font-mono text-sm md:text-base">Flow <span className="text-[#A78BFA]">|</span> WAGE</div>
          <button className="btn-ghost" onClick={() => setDemoMode(true)}>Explore Demo</button>
        </motion.nav>

        <section className="relative grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr] md:py-20">
          <motion.div initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.45 }}>
            <p className="text-xs uppercase tracking-[0.26em] text-[#C4B5FD]">Payroll, streamed per second</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.95] md:text-7xl">
              {words.map((word, index) => (
                <motion.span
                  key={word}
                  className="mr-3 inline-block"
                  initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.08 * index }}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              className="mt-6 max-w-xl text-base font-light text-muted-foreground md:text-lg"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.45 }}
            >
              A premium PayFi experience for employers and workers on HashKey testnet.
            </motion.p>
            <motion.div
              className="mt-7 flex flex-wrap gap-2 text-xs"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.62 }}
            >
              {['169M workers', '6-8% saved', 'Real-time'].map((chip) => (
                <span key={chip} className="rounded-full border border-[#A78BFA]/30 bg-black/30 px-3 py-1">
                  {chip}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-6"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.25 }}
          >
            <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Authenticate to continue into your payroll cockpit.</p>
            <motion.button
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className="btn-primary mt-6 flex w-full items-center gap-2"
              disabled={isPending || !connector}
              onClick={() => connector && connect({ connector })}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Connect Wallet
            </motion.button>
            {error ? <p className="mt-3 text-sm text-destructive">{error.message}</p> : null}
            <button className="btn-ghost mt-3 w-full" onClick={() => setDemoMode(true)}>
              Explore demo without wallet
            </button>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
