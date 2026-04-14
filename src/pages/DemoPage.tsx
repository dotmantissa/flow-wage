import { useMemo, useState } from 'react'
import { ExternalLink, RefreshCcw, FlaskConical } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

export function DemoPage() {
  const reduce = useReducedMotion()
  const setDemoMode = useAppStore((s) => s.setDemoMode)
  const [frameKey, setFrameKey] = useState(0)
  const exists = useMemo(() => true, [])

  return (
    <div className="min-h-screen bg-background px-4 pb-6 pt-4">
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.28 }}
        className="glass mx-auto max-w-6xl rounded-3xl p-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"><FlaskConical className="h-3.5 w-3.5" /> Demo mode</p>
            <h1 className="mt-2 text-2xl font-semibold">Interactive product preview</h1>
            <p className="text-sm text-muted-foreground">Explore the walkthrough without wallet connection. Reload anytime to restart animations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost inline-flex items-center gap-2" onClick={() => setFrameKey((k) => k + 1)}><RefreshCcw className="h-4 w-4" /> Reload demo</button>
            <a className="btn-ghost inline-flex items-center gap-2" href="./demo/index.html" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open full page</a>
            <button className="btn-primary" onClick={() => setDemoMode(false)}>Exit demo</button>
          </div>
        </div>
      </motion.section>

      <div id="security" className="mx-auto mt-4 max-w-6xl">
      {exists ? (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : 0.08 }}
          className="overflow-hidden rounded-3xl border border-white/15 bg-black/30"
        >
          <iframe key={frameKey} title="demo" src="./demo/index.html" className="h-[calc(100vh-180px)] min-h-[560px] w-full border-0" />
        </motion.div>
      ) : (
        <div className="glass rounded-2xl p-6 text-sm">Demo asset not found.</div>
      )}
      </div>
    </div>
  )
}
