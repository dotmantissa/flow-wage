import { useEmployeeStreams, useStream, useClaimableBalance } from '@/hooks/useStreamVault'
import { motion, useReducedMotion } from 'framer-motion'
import { CircleDollarSign, UserCircle2 } from 'lucide-react'
import { formatUSDT, truncateAddress } from '@/lib/utils'

function Card({ vault, id }: { vault: `0x${string}`; id: bigint }) {
  const reduce = useReducedMotion()
  const stream = useStream(vault, id)
  const claimable = useClaimableBalance(vault, id)
  const s = stream.data as
    | {
        employer: `0x${string}`
        totalDeposit: bigint
        startTime: bigint
        endTime: bigint
      }
    | undefined
  if (!s) return null

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : 0.28 }}
      className="glass rounded-2xl p-4"
    >
      <p className="font-mono text-sm">Stream #{id.toString()}</p>
      <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground"><UserCircle2 className="h-3.5 w-3.5" /> Employer: {truncateAddress(s.employer)}</p>
      <p className="mt-2 inline-flex items-center gap-2 text-sm"><CircleDollarSign className="h-4 w-4 text-[#A78BFA]" /> Claimable: <span className="font-mono text-primary">{formatUSDT((claimable.data as bigint | undefined) ?? 0n)} USDT</span></p>
      <p className="mt-2 text-xs text-muted-foreground">{new Date(Number(s.startTime) * 1000).toLocaleDateString()} {'->'} {new Date(Number(s.endTime) * 1000).toLocaleDateString()}</p>
    </motion.article>
  )
}

export function StreamCards({ vault, address }: { vault: `0x${string}`; address: `0x${string}` }) {
  const streams = useEmployeeStreams(vault, address)
  const ids = (streams.data as bigint[] | undefined) ?? []

  if (ids.length === 0) {
    return <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">No streams found for this vault and wallet yet.</div>
  }

  return <div className="grid gap-4 md:grid-cols-2">{ids.map((id) => <Card key={id.toString()} vault={vault} id={id} />)}</div>
}
