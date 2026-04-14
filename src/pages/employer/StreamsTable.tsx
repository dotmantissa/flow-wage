import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useClaimableBalance, useNextStreamId, usePauseStream, useResumeStream, useCancelStream, useStream, statusLabel } from '@/hooks/useStreamVault'
import { formatUSDT, truncateAddress } from '@/lib/utils'

function StreamRow({ vault, id }: { vault: `0x${string}`; id: bigint }) {
  const reduce = useReducedMotion()
  const stream = useStream(vault, id)
  const claimable = useClaimableBalance(vault, id)
  const pause = usePauseStream(vault)
  const resume = useResumeStream(vault)
  const cancel = useCancelStream(vault)

  const s = stream.data as
    | {
        employee: `0x${string}`
        totalDeposit: bigint
        scaledRate: bigint
        status: number
      }
    | undefined

  if (!s) return null

  const st = statusLabel(Number(s.status))

  return (
    <tr className="border-t border-white/10">
      <td className="p-2 font-mono">{String(id)}</td>
      <td className="p-2">{truncateAddress(s.employee)}</td>
      <td className="p-2 font-mono">{formatUSDT(s.totalDeposit)}</td>
      <td className="p-2 font-mono text-primary">{formatUSDT((claimable.data as bigint | undefined) ?? 0n)}</td>
      <td className="p-2 font-mono">{formatUSDT(Number(s.scaledRate) / 1e18)}</td>
      <td className="p-2"><span className="rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs">{st}</span></td>
      <td className="p-2">
        {st === 'Active' ? (
          <div className="flex gap-2"><motion.button whileHover={reduce ? undefined : { y: -1 }} className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => pause.pauseStream(id)}>Pause</motion.button><motion.button whileHover={reduce ? undefined : { y: -1 }} className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => cancel.cancelStream(id)}>Cancel</motion.button></div>
        ) : null}
        {st === 'Paused' ? (
          <div className="flex gap-2"><motion.button whileHover={reduce ? undefined : { y: -1 }} className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => resume.resumeStream(id)}>Resume</motion.button><motion.button whileHover={reduce ? undefined : { y: -1 }} className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => cancel.cancelStream(id)}>Cancel</motion.button></div>
        ) : null}
      </td>
    </tr>
  )
}

export function StreamsTable({ vault }: { vault: `0x${string}` }) {
  const reduce = useReducedMotion()
  const nextId = useNextStreamId(vault)
  const ids = useMemo(() => {
    const n = Number((nextId.data as bigint | undefined) ?? 1n)
    return Array.from({ length: Math.max(0, n - 1) }, (_, i) => BigInt(i + 1))
  }, [nextId.data])

  if (ids.length === 0) {
    return <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">No streams yet. Create one above to start payroll automation.</div>
  }

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : 0.32 }}
      className="glass rounded-3xl p-3 md:p-4"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Active streams</h3>
        <span className="rounded-full border border-white/20 px-2 py-1 text-xs text-muted-foreground">{ids.length} total</span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <th className="p-2">ID</th><th className="p-2">Employee</th><th className="p-2">Deposit</th><th className="p-2">Claimable</th><th className="p-2">Rate</th><th className="p-2">Status</th><th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>{ids.map((id) => <StreamRow key={id.toString()} vault={vault} id={id} />)}</tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        {ids.map((id) => (
          <div key={id.toString()} className="rounded-xl border border-white/15 bg-black/20 p-3">
            <p className="text-xs text-muted-foreground">Stream #{id.toString()}</p>
            <StreamRowCard vault={vault} id={id} />
          </div>
        ))}
      </div>
    </motion.section>
  )
}

function StreamRowCard({ vault, id }: { vault: `0x${string}`; id: bigint }) {
  const stream = useStream(vault, id)
  const claimable = useClaimableBalance(vault, id)
  const pause = usePauseStream(vault)
  const resume = useResumeStream(vault)
  const cancel = useCancelStream(vault)

  const s = stream.data as
    | {
        employee: `0x${string}`
        totalDeposit: bigint
        scaledRate: bigint
        status: number
      }
    | undefined

  if (!s) return null

  const st = statusLabel(Number(s.status))

  return (
    <div className="mt-2 grid gap-1 text-sm">
      <p>Employee: <span className="font-mono">{truncateAddress(s.employee)}</span></p>
      <p>Deposit: <span className="font-mono">{formatUSDT(s.totalDeposit)} USDT</span></p>
      <p>Claimable: <span className="font-mono text-primary">{formatUSDT((claimable.data as bigint | undefined) ?? 0n)} USDT</span></p>
      <p>Rate: <span className="font-mono">{formatUSDT(Number(s.scaledRate) / 1e18)} USDT/s</span></p>
      <p>Status: <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs">{st}</span></p>
      <div className="mt-1 flex gap-2">
        {st === 'Active' ? (
          <>
            <button className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => pause.pauseStream(id)}>Pause</button>
            <button className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => cancel.cancelStream(id)}>Cancel</button>
          </>
        ) : null}
        {st === 'Paused' ? (
          <>
            <button className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => resume.resumeStream(id)}>Resume</button>
            <button className="rounded-lg border border-white/20 px-2 py-1 text-xs" onClick={() => cancel.cancelStream(id)}>Cancel</button>
          </>
        ) : null}
      </div>
    </div>
  )
}
