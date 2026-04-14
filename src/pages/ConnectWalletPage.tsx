import { ArrowRight, Loader2, ShieldCheck, Wallet2, Zap } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useConnect } from 'wagmi'
import { useAppStore } from '@/store/useAppStore'

export function ConnectWalletPage() {
  const reduce = useReducedMotion()
  const { connect, connectors, isPending, error } = useConnect()
  const setDemoMode = useAppStore((s) => s.setDemoMode)

  const walletConnectors = connectors
  const primaryConnector = walletConnectors[0]

  const connectorLabel = (name: string) => {
    if (name === 'Injected') return 'Browser Wallet'
    return name
  }
  const words = ['Salaries', 'streamed.', 'Every', 'second.']

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
            <p className="text-xs uppercase tracking-[0.26em] text-[#C4B5FD]">Step 1 of 2 • Connect wallet</p>
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
              Real-time payroll streaming with instant withdrawals on HashKey testnet.
            </motion.p>
            <motion.div
              className="mt-7 flex flex-wrap gap-2 text-xs"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.62 }}
            >
              {['Built on HashKey Chain', 'Live stream math', 'Non-custodial vaults'].map((chip) => (
                <span key={chip} className="rounded-full border border-[#A78BFA]/30 bg-black/30 px-3 py-1">
                  {chip}
                </span>
              ))}
            </motion.div>

            <motion.div
              className="mt-8 grid gap-3 sm:grid-cols-3"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.7 }}
            >
              <div className="glass rounded-2xl p-3">
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Wallet2 className="h-3.5 w-3.5 text-[#A78BFA]" /> Connect</p>
                <p className="mt-1 text-sm">Authenticate wallet access</p>
              </div>
              <div className="glass rounded-2xl p-3">
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-[#A78BFA]" /> Choose role</p>
                <p className="mt-1 text-sm">Employer, worker, or both</p>
              </div>
              <div className="glass rounded-2xl p-3">
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Zap className="h-3.5 w-3.5 text-[#A78BFA]" /> Start streaming</p>
                <p className="mt-1 text-sm">Deploy and manage payouts</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="glass rounded-3xl p-6"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.25 }}
          >
            <h2 className="text-xl font-semibold">Connect your wallet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use any supported EVM wallet to enter the app. You will choose registration preferences in the next step.</p>
            <motion.button
              whileHover={reduce ? undefined : { scale: 1.03 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className="btn-primary mt-6 flex w-full items-center gap-2"
              disabled={isPending || !primaryConnector}
              onClick={() => primaryConnector && connect({ connector: primaryConnector })}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {primaryConnector ? `Connect ${connectorLabel(primaryConnector.name)}` : 'Connect Wallet'} <ArrowRight className="h-4 w-4" />
            </motion.button>

            {walletConnectors.length > 1 ? (
              <div className="mt-3 grid gap-2">
                {walletConnectors.slice(1).map((connector) => (
                  <button key={connector.uid} className="btn-ghost w-full" disabled={isPending} onClick={() => connect({ connector })}>
                    Connect with {connectorLabel(connector.name)}
                  </button>
                ))}
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-destructive">{error.message}</p> : null}
            <button className="btn-ghost mt-3 w-full" onClick={() => setDemoMode(true)}>
              Try Demo
            </button>
            <p className="mt-3 text-xs text-muted-foreground">No funds are moved on connect. Transactions require explicit wallet approval.</p>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
