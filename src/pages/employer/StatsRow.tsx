import { useBlockNumber, useChainId, useReadContract } from 'wagmi'
import { getAddresses, vaultContract } from '@/lib/contracts'
import { formatUSDT } from '@/lib/utils'

export function StatsRow({ vault }: { vault: `0x${string}` }) {
  const chainId = useChainId()
  const usdt = getAddresses(chainId).usdt
  const activeDeposits = useReadContract({ ...vaultContract(vault), functionName: 'activeDepositsByToken', args: [usdt] })
  const activeCount = useReadContract({ ...vaultContract(vault), functionName: 'activeStreamCount' })
  const block = useBlockNumber({ query: { refetchInterval: 10_000 } })

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-card p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Vault Balance</p><p className="mt-2 font-mono text-2xl">{formatUSDT(activeDeposits.data ?? 0n)} USDT</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Active Streams</p><p className="mt-2 font-mono text-2xl">{String(activeCount.data ?? 0n)}</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">Network</p><p className="mt-2">HashKey Chain Testnet · #{String(block.data ?? 0n)}</p></div>
    </div>
  )
}
