import { useState } from 'react'
import { isAddress } from 'viem'
import { useAccount } from 'wagmi'
import { motion, useReducedMotion } from 'framer-motion'
import { Link2 } from 'lucide-react'
import { useEmployeeStreams } from '@/hooks/useStreamVault'
import { useAppStore } from '@/store/useAppStore'

export function VaultConnector() {
  const reduce = useReducedMotion()
  const { address } = useAccount()
  const [input, setInput] = useState('')
  const [loaded, setLoaded] = useState<`0x${string}` | null>(null)
  const setVaultAddress = useAppStore((s) => s.setVaultAddress)

  const streams = useEmployeeStreams(loaded ?? undefined, address)

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: reduce ? 0 : 0.32 }}
      className="glass rounded-3xl p-5"
    >
      <p className="inline-flex items-center gap-2 text-sm font-medium"><Link2 className="h-4 w-4 text-[#A78BFA]" /> Connect your employer vault</p>
      <p className="mt-1 text-sm text-muted-foreground">Paste the vault address shared by your employer to load your streams.</p>
      <div className="mt-3 flex flex-col gap-2 md:flex-row">
        <input className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 focus-ring" placeholder="0x..." value={input} onChange={(e) => setInput(e.target.value)} />
        <motion.button
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          className="btn-primary"
          onClick={() => {
            if (!isAddress(input)) return
            const v = input as `0x${string}`
            setVaultAddress(v)
            setLoaded(v)
          }}
        >
          Load My Streams
        </motion.button>
      </div>
      {loaded ? <p className="mt-2 text-sm text-muted-foreground">Found <span className="font-mono text-foreground">{(streams.data as bigint[] | undefined)?.length ?? 0}</span> stream(s)</p> : null}
    </motion.section>
  )
}
