import { useMemo } from 'react'
import { useClaimableBalance, useNextStreamId, usePauseStream, useResumeStream, useCancelStream, useStream, statusLabel } from '@/hooks/useStreamVault'
import { formatUSDT, truncateAddress } from '@/lib/utils'

function StreamRow({ vault, id }: { vault: `0x${string}`; id: bigint }) {
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
    <tr className="border-t border-border/70">
      <td className="p-2 font-mono">{String(id)}</td>
      <td className="p-2">{truncateAddress(s.employee)}</td>
      <td className="p-2 font-mono">{formatUSDT(s.totalDeposit)}</td>
      <td className="p-2 font-mono text-primary">{formatUSDT((claimable.data as bigint | undefined) ?? 0n)}</td>
      <td className="p-2 font-mono">{formatUSDT(Number(s.scaledRate) / 1e18)}</td>
      <td className="p-2"><span className="rounded-full border px-2 py-1 text-xs">{st}</span></td>
      <td className="p-2">
        {st === 'Active' ? (
          <div className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={() => pause.pauseStream(id)}>Pause</button><button className="rounded border px-2 py-1 text-xs" onClick={() => cancel.cancelStream(id)}>Cancel</button></div>
        ) : null}
        {st === 'Paused' ? (
          <div className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={() => resume.resumeStream(id)}>Resume</button><button className="rounded border px-2 py-1 text-xs" onClick={() => cancel.cancelStream(id)}>Cancel</button></div>
        ) : null}
      </td>
    </tr>
  )
}

export function StreamsTable({ vault }: { vault: `0x${string}` }) {
  const nextId = useNextStreamId(vault)
  const ids = useMemo(() => {
    const n = Number((nextId.data as bigint | undefined) ?? 1n)
    return Array.from({ length: Math.max(0, n - 1) }, (_, i) => BigInt(i + 1))
  }, [nextId.data])

  if (ids.length === 0) {
    return <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">No streams yet - create one above</div>
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th className="p-2">ID</th><th className="p-2">Employee</th><th className="p-2">Deposit</th><th className="p-2">Claimable</th><th className="p-2">Rate</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
        <tbody>{ids.map((id) => <StreamRow key={id.toString()} vault={vault} id={id} />)}</tbody>
      </table>
    </div>
  )
}
