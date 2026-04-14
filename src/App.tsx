import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { ConnectWalletPage } from '@/pages/ConnectWalletPage'
import { WrongNetworkPage } from '@/pages/WrongNetworkPage'
import { LoadingPage } from '@/pages/LoadingPage'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { EmployerDashboard } from '@/pages/employer/EmployerDashboard'
import { WorkerDashboard } from '@/pages/worker/WorkerDashboard'
import { DemoPage } from '@/pages/DemoPage'
import { useNetworkGuard } from '@/hooks/useNetworkGuard'
import { useUserRole } from '@/hooks/useUserRole'
import { useAppStore } from '@/store/useAppStore'
import { MissingConfigBanner } from '@/components/shared/MissingConfigBanner'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

function TimedLoading({ onRetry }: { onRetry: () => void }) {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(id)
  }, [])

  return (
    <>
      <LoadingPage />
      {slow ? (
        <div className="fixed bottom-6 left-1/2 z-40 w-[min(92vw,500px)] -translate-x-1/2 rounded-lg border bg-card p-3 text-sm">
          This is taking longer than expected. Check your network connection.
          <button className="ml-3 rounded border px-2 py-1 text-xs" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
    </>
  )
}

export default function App() {
  const reduce = useReducedMotion()
  const { isConnected, address } = useAccount()
  const { isCorrectNetwork } = useNetworkGuard()
  const { role, isLoading, refetch } = useUserRole()
  const isDemoMode = useAppStore((s) => s.isDemoMode)
  const preferredMode = useAppStore((s) => s.preferredMode)
  const preferredModeByAddress = useAppStore((s) => s.preferredModeByAddress)
  const lastConnectedAddress = useAppStore((s) => s.lastConnectedAddress)
  const setPreferredMode = useAppStore((s) => s.setPreferredMode)
  const setLastConnectedAddress = useAppStore((s) => s.setLastConnectedAddress)

  useEffect(() => {
    if (!isConnected || !address) return

    const key = address.toLowerCase()
    const saved = preferredModeByAddress[key] ?? null

    if (lastConnectedAddress !== address) {
      setLastConnectedAddress(address)
    }

    if (preferredMode !== saved) {
      setPreferredMode(saved)
    }
  }, [isConnected, address, lastConnectedAddress, preferredMode, preferredModeByAddress, setLastConnectedAddress, setPreferredMode])

  const page = useMemo(() => {
    if (isDemoMode) return <DemoPage />
    if (!isConnected) return <ConnectWalletPage />
    if (!isCorrectNetwork) return <WrongNetworkPage />
    if (isLoading) return <TimedLoading onRetry={() => refetch()} />
    if (!preferredMode) {
      return (
        <ErrorBoundary title="Onboarding">
          <OnboardingPage canBeEmployer={Boolean(role?.isEmployer)} />
        </ErrorBoundary>
      )
    }
    if (preferredMode === 'employer') {
      if (!role?.isEmployer) {
        return (
          <ErrorBoundary title="Onboarding">
            <OnboardingPage canBeEmployer={Boolean(role?.isEmployer)} />
          </ErrorBoundary>
        )
      }
      return (
        <ErrorBoundary title="Employer Dashboard">
          <EmployerDashboard />
        </ErrorBoundary>
      )
    }
    if (preferredMode === 'both') {
      if (role?.isEmployer) {
        return (
          <ErrorBoundary title="Employer Dashboard">
            <EmployerDashboard />
          </ErrorBoundary>
        )
      }
      return (
        <ErrorBoundary title="Worker Dashboard">
          <WorkerDashboard />
        </ErrorBoundary>
      )
    }
    return (
      <ErrorBoundary title="Worker Dashboard">
        <WorkerDashboard />
      </ErrorBoundary>
    )
  }, [isDemoMode, isConnected, isCorrectNetwork, isLoading, role, refetch, preferredMode])

  const key = isDemoMode
    ? 'demo'
    : isConnected
      ? isCorrectNetwork
        ? role?.isEmployer
          ? preferredMode === 'employer'
            ? 'employer'
            : preferredMode === 'both'
              ? 'both'
            : preferredMode === 'worker'
              ? 'worker'
              : 'onboarding'
          : preferredMode === 'worker'
            ? 'worker'
            : 'onboarding'
        : 'network'
      : 'connect'

  return (
    <div className="app-shell">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <div className="orb orb-c" />
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: reduce ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {page}
        </motion.div>
      </AnimatePresence>
      <MissingConfigBanner />
      {!isDemoMode ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 rounded-lg border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200">
          Testnet mode: KYC checks are temporarily relaxed. KYC will be compulsory at mainnet launch.
        </div>
      ) : null}
    </div>
  )
}
