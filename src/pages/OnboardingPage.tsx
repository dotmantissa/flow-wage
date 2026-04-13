import { Loader2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useKYCStatus } from '@/hooks/usePayrollRegistry'
import { truncateAddress } from '@/lib/utils'

const statusMap: Record<number, { label: string; color: string; message: string }> = {
  0: { label: 'Unverified', color: 'text-slate-300', message: 'Your wallet has not started KYC yet.' },
  1: { label: 'Pending', color: 'text-amber-300', message: 'KYC is under review by protocol operators.' },
  2: { label: 'Approved', color: 'text-emerald-300', message: 'KYC approved. You can now interact as a worker.' },
  3: { label: 'Revoked', color: 'text-red-300', message: 'KYC has been revoked. Contact support.' },
}

export function OnboardingPage() {
  const { address } = useAccount()
  const status = useKYCStatus(address)
  const value = Number(status.data ?? 0)
  const current = statusMap[value] ?? statusMap[0]

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-2xl font-semibold">Onboarding</h2>
        <p className="mt-1 text-sm text-muted-foreground">Wallet: {truncateAddress(address)}</p>
        <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-sm ${current.color}`}>{current.label}</div>
        <p className="mt-3 text-muted-foreground">{current.message}</p>
        <button className="mt-4 flex items-center gap-2 rounded-md border px-4 py-2" onClick={() => status.refetch()}>
          {status.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Check Again
        </button>
      </div>
    </div>
  )
}
