import { useState } from 'react'
import { isAddress } from 'viem'
import { useAccount } from 'wagmi'
import { useEmployeeStreams } from '@/hooks/useStreamVault'
import { useAppStore } from '@/store/useAppStore'

export function VaultConnector() {
  const { address } = useAccount()
  const [input, setInput] = useState('')
  const [loaded, setLoaded] = useState<`0x${string}` | null>(null)
  const setVaultAddress = useAppStore((s) => s.setVaultAddress)

  const streams = useEmployeeStreams(loaded ?? undefined, address)

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm">Enter your vault address</p>
      <div className="mt-2 flex gap-2">
        <input className="w-full rounded-md border bg-background px-3 py-2" value={input} onChange={(e) => setInput(e.target.value)} />
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => {
            if (!isAddress(input)) return
            const v = input as `0x${string}`
            setVaultAddress(v)
            setLoaded(v)
          }}
        >
          Load My Streams
        </button>
      </div>
      {loaded ? <p className="mt-2 text-sm text-muted-foreground">Found {(streams.data as bigint[] | undefined)?.length ?? 0} streams</p> : null}
    </div>
  )
}
