import { useMemo, useState } from 'react'
import { isAddress } from 'viem'
import { Loader2, Trash2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { motion, useReducedMotion } from 'framer-motion'
import { AppHeader } from '@/components/layout/AppHeader'
import { useAppStore } from '@/store/useAppStore'
import { formatUSDT } from '@/lib/utils'
import { useClaimableBalance, useEarnedBalance, useEmployeeStreams, useStream, useWithdrawAll } from '@/hooks/useStreamVault'

type WithdrawalItem = {
  amount: string
  date: string
  hash: string
}

function statusMeta(status: number) {
  if (status === 1) return { label: 'Paused', className: 'border border-amber-500/30 bg-amber-500/15 text-amber-300' }
  if (status === 2 || status === 3) return { label: 'Ended', className: 'border border-white/20 bg-white/10 text-white/70' }
  return { label: 'Active', className: 'border border-emerald-400/35 bg-emerald-400/15 text-emerald-300' }
}

function WorkerStreamCard({ vault, id }: { vault: `0x${string}`; id: bigint }) {
  const stream = useStream(vault, id)
  const earned = useEarnedBalance(vault, id)

  const s = stream.data as
    | {
        totalDeposit: bigint
        withdrawn: bigint
        scaledRate: bigint
        startTime: bigint
        endTime: bigint
        status: number
      }
    | undefined

  if (!s) return null

  const secondsInMonth = 30 * 24 * 60 * 60
  const monthlyRate = (Number(s.scaledRate) / 1e18) * secondsInMonth
  const progress = s.totalDeposit > 0n ? Math.min(100, Math.max(0, Number((s.withdrawn * 10000n) / s.totalDeposit) / 100)) : 0
  const start = new Date(Number(s.startTime) * 1000)
  const end = new Date(Number(s.endTime) * 1000)
  const st = statusMeta(Number(s.status))

  return (
    <article className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Stream #{id.toString()}</p>
        <span className={`rounded-full px-3 py-1 text-xs ${st.className}`}>{st.label}</span>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Monthly rate</span>
          <span className="font-mono">{monthlyRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} USDT</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Period</span>
          <span className="font-mono">{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {'->'} {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Total earned</span>
          <span className="font-mono">{formatUSDT((earned.data as bigint | undefined) ?? 0n)} USDT</span>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#00e5b4]" style={{ width: `${progress}%` }} />
      </div>
    </article>
  )
}

export function WorkerDashboard() {
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const vault = useAppStore((s) => s.vaultAddress)
  const setVaultAddress = useAppStore((s) => s.setVaultAddress)
  const workerVaults = useAppStore((s) => s.workerVaults)
  const addWorkerVault = useAppStore((s) => s.addWorkerVault)
  const removeWorkerVault = useAppStore((s) => s.removeWorkerVault)
  const [vaultInput, setVaultInput] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])

  const streams = useEmployeeStreams(vault ?? undefined, address)
  const ids = (streams.data as bigint[] | undefined) ?? []
  const first = ids[0]
  const firstStream = useStream(vault ?? undefined, first)
  const claimable = useClaimableBalance(vault ?? undefined, first)
  const withdraw = useWithdrawAll(vault ?? undefined)

  const streamData = firstStream.data as { scaledRate: bigint } | undefined
  const perSecond = streamData ? Number(streamData.scaledRate) / 1e18 : null
  const claimableValue = (claimable.data as bigint | undefined) ?? 0n
  const canWithdraw = Boolean(vault && first !== undefined && claimableValue > 0n && !withdraw.isPending && !!address)

  const heroValue = useMemo(() => {
    if (!vault || first === undefined) return '-.------'
    return formatUSDT(claimableValue)
  }, [vault, first, claimableValue])

  const onLoadVault = () => {
    if (!isAddress(vaultInput)) {
      setInputError('Please enter a valid 0x address.')
      return
    }
    setInputError(null)
    const connectedVault = vaultInput as `0x${string}`
    setVaultAddress(connectedVault)
    addWorkerVault(connectedVault)
    setVaultInput('')
  }

  const onWithdrawAll = async () => {
    if (!address || first === undefined || !vault) return
    const amountSnapshot = formatUSDT(claimableValue)
    const txHash = await withdraw.withdrawAll(first, address)
    if (txHash) {
      setWithdrawals((prev) => [
        {
          amount: `${amountSnapshot} USDT`,
          date: new Date().toLocaleString(),
          hash: txHash,
        },
        ...prev,
      ])
    }
  }

  return (
    <div id="overview">
      <AppHeader role="Worker" />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
        <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.35 }}>
          <h1 className="text-3xl font-semibold md:text-4xl">Worker earnings cockpit</h1>
          <p className="mt-2 text-sm text-muted-foreground">Track claimable income, connect your vault, and withdraw in one tap.</p>
        </motion.div>

        <section className="glass scroll-mt-28 rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Connected vaults</h2>
          {workerVaults.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No vaults connected yet.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {workerVaults.map((item) => (
                <div key={item} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[var(--bg-raise)] px-3 py-2">
                  <button type="button" className={`rounded-full px-3 py-1.5 text-left font-mono text-xs transition ${vault === item ? 'bg-[var(--purple-bg)] text-white' : 'bg-white/5 text-muted-foreground hover:text-white'}`} onClick={() => setVaultAddress(item)}>
                    {item}
                  </button>
                  <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2 py-1 text-xs text-muted-foreground hover:text-white" onClick={() => removeWorkerVault(item)}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {!vault ? (
          <section className="glass scroll-mt-28 rounded-2xl p-5">
            <h2 className="text-xl font-semibold">Connect your payroll vault</h2>
            <p className="mt-1 text-sm text-muted-foreground">Paste vault address from your employer to load your salary streams.</p>
            <div className="mt-4 flex flex-col gap-2 md:flex-row">
              <input
                value={vaultInput}
                onChange={(event) => setVaultInput(event.target.value)}
                placeholder="Paste vault address from your employer (0x...)"
                className="focus-ring w-full rounded-full border border-white/15 bg-[var(--bg-raise)] px-4 py-3 text-sm"
              />
              <button className="btn-primary" onClick={onLoadVault}>Load Streams</button>
            </div>
            {inputError ? <p className="mt-2 text-sm text-red-300">{inputError}</p> : null}
          </section>
        ) : null}

        <section className="scroll-mt-28 rounded-2xl border border-[#00e5b4]/30 bg-[var(--bg-card)] p-6 shadow-[0_0_40px_rgba(0,229,180,0.12)]">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[rgba(255,255,255,0.5)]">AVAILABLE TO WITHDRAW</p>
          <p className="mt-3 font-mono text-[clamp(48px,8vw,80px)] font-semibold leading-none text-[#00e5b4]">{heroValue}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {perSecond !== null ? `Earning ${perSecond.toFixed(8)} USDT/sec` : 'Connect vault to see your rate'}
          </p>
          <p className="mt-2 font-mono text-xs text-[var(--muted-hi)]">1 USDT {'->'} 7.82 HKD  ·  56.21 PHP  ·  83.44 INR</p>
          <div className="mt-5 flex justify-center">
            <button
              className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#7c3aed] px-6 text-sm font-semibold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-55 md:w-auto"
              onClick={onWithdrawAll}
              disabled={!canWithdraw}
            >
              {withdraw.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {withdraw.isPending ? 'Withdrawing...' : 'Withdraw All'}
            </button>
          </div>
        </section>

        <section id="streams" className="scroll-mt-28 grid gap-4">
          {vault ? (
            ids.length > 0 ? (
              ids.map((id) => <WorkerStreamCard key={id.toString()} vault={vault} id={id} />)
            ) : (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No streams found for your address in this vault</div>
            )
          ) : null}
        </section>

        <section id="security" className="glass scroll-mt-28 rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Recent Withdrawals</h2>
          {withdrawals.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Withdrawals will appear here after your first transaction</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {withdrawals.map((item) => (
                <div key={item.hash} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[var(--bg-raise)] px-3 py-2 text-sm md:flex-row md:items-center md:justify-between">
                  <span className="font-mono">{item.amount}</span>
                  <span className="text-muted-foreground">{item.date}</span>
                  <a className="font-mono text-[#00e5b4] hover:underline" href={`https://testnet-explorer.hsk.xyz/tx/${item.hash}`} target="_blank" rel="noreferrer">
                    {item.hash.slice(0, 6)}...{item.hash.slice(-4)}
                  </a>
                </div>
              ))}
            </div>
          )}

        </section>
      </main>
    </div>
  )
}
