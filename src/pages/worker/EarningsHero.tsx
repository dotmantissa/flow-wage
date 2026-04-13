import { useAccount } from 'wagmi'
import { useWithdrawAll, useClaimableBalance, useStream } from '@/hooks/useStreamVault'
import { formatUSDT } from '@/lib/utils'

export function EarningsHero({ vault, streamId }: { vault: `0x${string}`; streamId: bigint }) {
  const { address } = useAccount()
  const claimable = useClaimableBalance(vault, streamId)
  const stream = useStream(vault, streamId)
  const withdraw = useWithdrawAll(vault)

  const scaledRate = Number((stream.data as { scaledRate: bigint } | undefined)?.scaledRate ?? 0n) / 1e18

  return (
    <div className="rounded-xl border bg-card p-6 shadow-[0_0_50px_rgba(0,229,180,0.15)]">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Available to Withdraw</p>
      <p className="mt-2 font-mono text-5xl text-primary">${formatUSDT((claimable.data as bigint | undefined) ?? 0n)}</p>
      <p className="mt-2 text-sm text-muted-foreground">Earning {scaledRate.toFixed(8)} USDT/sec</p>
      <p className="mt-1 text-xs text-muted-foreground">1 USDT {'->'} 7.82 HKD · 56.21 PHP</p>
      <button
        className="mt-4 w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50 md:w-auto"
        onClick={() => address && withdraw.withdrawAll(streamId, address)}
        disabled={((claimable.data as bigint | undefined) ?? 0n) === 0n || withdraw.isPending}
      >
        {withdraw.isPending ? 'Withdrawing...' : 'Withdraw All'}
      </button>
    </div>
  )
}
