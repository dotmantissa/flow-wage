import { useEmployeeStreams, useStream, useClaimableBalance } from '@/hooks/useStreamVault'
import { formatUSDT, truncateAddress } from '@/lib/utils'

function Card({ vault, id }: { vault: `0x${string}`; id: bigint }) {
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
    <div className="rounded-xl border bg-card p-4">
      <p className="font-mono text-sm">Stream #{id.toString()}</p>
      <p className="mt-1 text-sm text-muted-foreground">Employer: {truncateAddress(s.employer)}</p>
      <p className="mt-1 text-sm">Claimable: <span className="font-mono text-primary">{formatUSDT((claimable.data as bigint | undefined) ?? 0n)} USDT</span></p>
      <p className="mt-1 text-xs text-muted-foreground">{new Date(Number(s.startTime) * 1000).toLocaleDateString()} {'->'} {new Date(Number(s.endTime) * 1000).toLocaleDateString()}</p>
    </div>
  )
}

export function StreamCards({ vault, address }: { vault: `0x${string}`; address: `0x${string}` }) {
  const streams = useEmployeeStreams(vault, address)
  const ids = (streams.data as bigint[] | undefined) ?? []

  return <div className="grid gap-4">{ids.map((id) => <Card key={id.toString()} vault={vault} id={id} />)}</div>
}
