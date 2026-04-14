import { useState } from 'react'
import { isAddress, parseUnits } from 'viem'
import { z } from 'zod'
import { toast } from 'sonner'
import { useChainId } from 'wagmi'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { CalendarClock, Coins, Plus, UserRound } from 'lucide-react'
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
  const reduce = useReducedMotion()
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
    <section className="glass rounded-3xl p-5 md:p-6" id="new-stream">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Create payment stream</h3>
          <p className="text-sm text-muted-foreground">Configure recipient, deposit and schedule in one transaction flow.</p>
        </div>
        {!open ? (
          <button className="btn-ghost inline-flex items-center gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Stream
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 6 }}
            transition={{ duration: reduce ? 0 : 0.24 }}
            className="grid gap-3"
          >
            <label className="grid gap-1.5">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><UserRound className="h-3.5 w-3.5" /> Employee wallet</span>
              <input className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm focus-ring" placeholder="0x..." value={form.employee} onChange={(e) => setForm((p) => ({ ...p, employee: e.target.value }))} />
            </label>

            <label className="grid gap-1.5">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Coins className="h-3.5 w-3.5" /> Total deposit (USDT)</span>
              <input className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm focus-ring" placeholder="500.00" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Start</span>
                <input className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm focus-ring" type="datetime-local" value={form.start} onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))} />
              </label>
              <label className="grid gap-1.5">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> End</span>
                <input className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm focus-ring" type="datetime-local" value={form.end} onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))} />
              </label>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Rate </span>
              <span className="font-mono">{rate.toFixed(8)} USDT/sec</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <motion.button whileHover={reduce ? undefined : { scale: 1.02 }} whileTap={reduce ? undefined : { scale: 0.98 }} className="btn-primary" onClick={submit} disabled={approving || creating}>
                {needsApproval ? (approving ? 'Approving...' : 'Step 1: Approve USDT') : creating ? 'Creating...' : 'Create Stream'}
              </motion.button>
              <button className="btn-ghost" onClick={() => setOpen(false)} disabled={approving || creating}>Close</button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}
