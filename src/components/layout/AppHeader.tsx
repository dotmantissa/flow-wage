import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, ShieldCheck, Wallet, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { truncateAddress } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

type Props = { role: 'Employer' | 'Worker' }

export function AppHeader({ role }: Props) {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeId, setActiveId] = useState<string>('overview')
  const preferredMode = useAppStore((s) => s.preferredMode)
  const setPreferredMode = useAppStore((s) => s.setPreferredMode)

  const mode = preferredMode === 'employer' ? 'employer' : preferredMode === 'worker' ? 'worker' : role.toLowerCase()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const ids = ['overview', 'streams', 'security']
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0.15, 0.4, 0.7] },
    )

    ids.forEach((id) => {
      const node = document.getElementById(id)
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [])

  const links: Array<{ label: string; id: string }> = [
    { label: 'Overview', id: 'overview' },
    { label: 'Streams', id: 'streams' },
    { label: 'Security', id: 'security' },
  ]

  const navigateTo = (id: string) => {
    const node = document.getElementById(id)
    if (node) {
      const top = node.getBoundingClientRect().top + window.scrollY - 112
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' })
      setActiveId(id)
      setOpen(false)
      return
    }
    if (id === 'security') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
      setOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <motion.div
        initial={false}
        animate={{
          backgroundColor: scrolled ? 'rgba(14, 10, 25, 0.82)' : 'rgba(14, 10, 25, 0.36)',
          borderColor: scrolled ? 'rgba(167,139,250,0.28)' : 'rgba(167,139,250,0.16)',
        }}
        transition={{ duration: reduce ? 0 : 0.25 }}
        className="glass mx-auto flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-3"
      >
        <div className="font-mono text-sm md:text-base">Flow <span className="text-[#A78BFA]">|</span> WAGE</div>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <motion.button
              key={link.label}
              type="button"
              whileHover={reduce ? undefined : { y: -1 }}
              className={`group relative text-sm transition-colors ${activeId === link.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => navigateTo(link.id)}
            >
              {link.label}
              <span className={`absolute -bottom-1 left-1/2 h-px -translate-x-1/2 bg-[#A78BFA] transition-all duration-200 ${activeId === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`} />
            </motion.button>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#A78BFA]/30 bg-black/30 px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C4B5FD]" /> HashKey Testnet
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#A78BFA]/25 px-3 py-1 text-xs text-muted-foreground">
            <Wallet className="h-3.5 w-3.5" /> {truncateAddress(address)}
          </span>
          <select
            value={mode}
            onChange={(event) => setPreferredMode(event.target.value as 'employer' | 'worker')}
            className="rounded-full border border-[#A78BFA]/25 bg-black/30 px-3 py-1 text-xs text-foreground"
          >
            <option value="worker">Worker View</option>
            <option value="employer">Employer View</option>
          </select>
          <motion.button whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.97 }} className="btn-ghost" onClick={() => disconnect()}>
            Disconnect
          </motion.button>
        </div>

        <button type="button" className="inline-flex rounded-full border border-[#A78BFA]/25 p-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-4 w-4" />
        </button>
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={reduce ? { x: 0 } : { x: 220 }}
              animate={{ x: 0 }}
              exit={reduce ? { x: 0 } : { x: 220 }}
              transition={{ duration: reduce ? 0 : 0.28 }}
              className="glass absolute right-0 top-0 h-full w-72 border-l border-[#A78BFA]/25 p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-mono text-sm">Navigation</span>
                <button type="button" className="rounded-full border border-[#A78BFA]/25 p-1.5" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <select
                  value={mode}
                  onChange={(event) => setPreferredMode(event.target.value as 'employer' | 'worker')}
                  className="block w-full rounded-xl border border-[#A78BFA]/20 bg-black/30 px-3 py-2 text-sm"
                >
                  <option value="worker">Worker View</option>
                  <option value="employer">Employer View</option>
                </select>
                {links.map((link) => (
                  <button type="button" key={link.label} className="block w-full rounded-xl border border-[#A78BFA]/20 px-3 py-2 text-left text-sm" onClick={() => navigateTo(link.id)}>
                    {link.label}
                  </button>
                ))}
                <button className="btn-ghost mt-4 w-full" onClick={() => disconnect()}>
                  Disconnect
                </button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
