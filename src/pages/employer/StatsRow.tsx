import { motion, useReducedMotion } from 'framer-motion'
import { Activity, BanknoteArrowDown, Blocks } from 'lucide-react'
import { useBlockNumber, useChainId, useReadContract } from 'wagmi'
import { AnimatedCounter } from '@/components/shared/AnimatedCounter'
import { getAddresses, vaultContract } from '@/lib/contracts'

export function StatsRow({ vault }: { vault: `0x${string}` }) {
  const reduce = useReducedMotion()
  const chainId = useChainId()
  const usdt = getAddresses(chainId).usdt
  const activeDeposits = useReadContract({ ...vaultContract(vault), functionName: 'activeDepositsByToken', args: [usdt] })
  const activeCount = useReadContract({ ...vaultContract(vault), functionName: 'activeStreamCount' })
  const block = useBlockNumber({ query: { refetchInterval: 10_000 } })
  const vaultBalance = Number((activeDeposits.data as bigint | undefined) ?? 0n) / 1e6
  const activeStreams = Number((activeCount.data as bigint | undefined) ?? 0n)
  const blockNum = Number(block.data ?? 0n)

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : 0.36 }}
      className="contrast-break grid gap-4 rounded-3xl p-4 md:grid-cols-3"
    >
      <article className="rounded-2xl border border-[#6D28D9]/15 bg-white/75 p-4">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#4C1D95]"><BanknoteArrowDown className="h-3.5 w-3.5" /> Vault Balance</p>
        <p className="mt-2 font-mono text-3xl text-[#4C1D95]"><AnimatedCounter value={vaultBalance} decimals={2} suffix=" USDT" /></p>
      </article>

      <article className="rounded-2xl border border-[#6D28D9]/15 bg-white/75 p-4">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#4C1D95]"><Activity className="h-3.5 w-3.5" /> Active Streams</p>
        <p className="mt-2 font-mono text-3xl text-[#4C1D95]"><AnimatedCounter value={activeStreams} decimals={0} /></p>
      </article>

      <article className="rounded-2xl border border-[#6D28D9]/15 bg-white/75 p-4">
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#4C1D95]"><Blocks className="h-3.5 w-3.5" /> Network</p>
        <p className="mt-2 font-mono text-3xl text-[#4C1D95]"><AnimatedCounter value={blockNum} decimals={0} /></p>
        <p className="text-xs text-[#4C1D95]/80">HashKey Chain Testnet</p>
      </article>
    </motion.section>
  )
}
