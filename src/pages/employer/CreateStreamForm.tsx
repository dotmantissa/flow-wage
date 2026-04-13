import { useState } from 'react'
import { isAddress, parseUnits } from 'viem'
import { z } from 'zod'
import { toast } from 'sonner'
import { useChainId } from 'wagmi'
import { getAddresses } from '@/lib/contracts'
import { useApproveToken, useTokenAllowance } from '@/hooks/useTokenApproval'
import { useCreateStream } from '@/hooks/useStreamVault'

const schema = z
  .object({
    employee: z.string().min(1),
    amount: z.string().min(1),
    start: z.string().min(1),
    end: z.string().min(1),
  })
  .refine((v) => isAddress(v.employee), { message: 'Employee address is invalid' })
  .refine((v) => Number(v.amount) > 0, { message: 'Deposit must be greater than zero' })
  .refine((v) => new Date(v.end).getTime() > new Date(v.start).getTime(), { message: 'End must be after start' })

export function CreateStreamForm({ vault }: { vault: `0x${string}` }) {
  const chainId = useChainId()
  const token = getAddresses(chainId).usdt
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ employee: '', amount: '', start: '', end: '' })

  const allowance = useTokenAllowance(token, vault)
  const { approve, isPending: approving } = useApproveToken(token, vault)
  const { createStream, isPending: creating } = useCreateStream(vault)

  const amount = form.amount ? parseUnits(form.amount, 6) : 0n
  const currentAllowance = (allowance.data as bigint | undefined) ?? 0n
  const needsApproval = currentAllowance < amount

  const rate = form.amount && form.start && form.end
    ? Number(form.amount) / Math.max(1, (new Date(form.end).getTime() - new Date(form.start).getTime()) / 1000)
    : 0

  const submit = async () => {
    const validation = schema.safeParse(form)
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? 'Invalid form')
      return
    }

    if (needsApproval) {
      await approve(amount)
      return
    }

    await createStream({
      employee: form.employee as `0x${string}`,
      token,
      totalDeposit: amount,
      startTime: BigInt(Math.floor(new Date(form.start).getTime() / 1000)),
      endTime: BigInt(Math.floor(new Date(form.end).getTime() / 1000)),
    })
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      {!open ? (
        <button className="rounded-md border px-3 py-2" onClick={() => setOpen(true)}>+ New Stream</button>
      ) : (
        <div className="space-y-3">
          <input className="w-full rounded-md border bg-background px-3 py-2" placeholder="Employee Address" value={form.employee} onChange={(e) => setForm((p) => ({ ...p, employee: e.target.value }))} />
          <input className="w-full rounded-md border bg-background px-3 py-2" placeholder="Total Deposit (USDT)" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
          <input className="w-full rounded-md border bg-background px-3 py-2" type="datetime-local" value={form.start} onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))} />
          <input className="w-full rounded-md border bg-background px-3 py-2" type="datetime-local" value={form.end} onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))} />
          <p className="text-sm text-muted-foreground">Rate: {rate.toFixed(8)} USDT/sec</p>
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={submit} disabled={approving || creating}>
            {needsApproval ? (approving ? 'Approving...' : 'Step 1: Approve USDT') : creating ? 'Creating...' : 'Create Stream'}
          </button>
        </div>
      )}
    </div>
  )
}
