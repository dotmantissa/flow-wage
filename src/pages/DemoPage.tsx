import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function DemoPage() {
  const setDemoMode = useAppStore((s) => s.setDemoMode)
  const exists = useMemo(() => true, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm">
        <span className="rounded-full bg-amber-500/20 px-2 py-1 text-amber-300">Demo Mode</span>
        <button className="rounded border border-amber-300/40 px-3 py-1" onClick={() => setDemoMode(false)}>Exit demo</button>
      </div>
      {exists ? (
        <iframe title="demo" src="./demo/index.html" className="h-[calc(100vh-48px)] w-full border-0" />
      ) : (
        <div className="p-6">Demo asset not found.</div>
      )}
    </div>
  )
}
