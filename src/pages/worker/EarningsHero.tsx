import { useAccount } from 'wagmi'
import { motion, useReducedMotion } from 'framer-motion'
import { Wallet, Zap } from 'lucide-react'
import { AnimatedCounter } from '@/components/shared/AnimatedCounter'
import { useWithdrawAll, useClaimableBalance, useStream } from '@/hooks/useStreamVault'
import { formatUSDT } from '@/lib/utils'

export function EarningsHero({ vault, streamId }: { vault: `0x${string}`; streamId: bigint }) {
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const claimable = useClaimableBalance(vault, streamId)
  const stream = useStream(vault, streamId)
  const withdraw = useWithdrawAll(vault)

  const scaledRate = Number((stream.data as { scaledRate: bigint } | undefined)?.scaledRate ?? 0n) / 1e18
  const claimableNum = Number((claimable.data as bigint | undefined) ?? 0n) / 1e6

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : 0.35 }}
      className="glass relative overflow-hidden rounded-3xl p-6"
    >
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#A78BFA]/20 blur-3xl" aria-hidden />
      <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Available to withdraw</p>
      <p className="mt-2 font-mono text-5xl text-primary">
        $<AnimatedCounter value={claimableNum} decimals={2} />
      </p>
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground"><Zap className="h-3.5 w-3.5 text-[#A78BFA]" /> Earning {scaledRate.toFixed(8)} USDT/sec</p>
      <p className="mt-1 text-xs text-muted-foreground">Indicative FX: 1 USDT {'->'} 7.82 HKD · 56.21 PHP</p>
      <motion.button
        whileHover={reduce ? undefined : { scale: 1.02 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
        className="btn-primary mt-4 w-full disabled:opacity-50 md:w-auto"
        onClick={() => address && withdraw.withdrawAll(streamId, address)}
        disabled={((claimable.data as bigint | undefined) ?? 0n) === 0n || withdraw.isPending}
      >
        {withdraw.isPending ? 'Withdrawing...' : 'Withdraw All'}
      </motion.button>
      <p className="mt-2 text-xs text-muted-foreground">Raw on-chain claimable: {formatUSDT((claimable.data as bigint | undefined) ?? 0n)} USDT</p>
    </motion.section>
  )
}
