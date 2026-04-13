import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
  const { isConnected } = useAccount()
  const { isCorrectNetwork } = useNetworkGuard()
  const { role, isLoading, refetch } = useUserRole()
  const isDemoMode = useAppStore((s) => s.isDemoMode)

  const page = useMemo(() => {
    if (isDemoMode) return <DemoPage />
    if (!isConnected) return <ConnectWalletPage />
    if (!isCorrectNetwork) return <WrongNetworkPage />
    if (isLoading) return <TimedLoading onRetry={() => refetch()} />
    if (role?.isEmployer) {
      return (
        <ErrorBoundary title="Employer Dashboard">
          <EmployerDashboard />
        </ErrorBoundary>
      )
    }
    if (role?.isWorker) {
      return (
        <ErrorBoundary title="Worker Dashboard">
          <WorkerDashboard />
        </ErrorBoundary>
      )
    }
    return (
      <ErrorBoundary title="Onboarding">
        <OnboardingPage />
      </ErrorBoundary>
    )
  }, [isDemoMode, isConnected, isCorrectNetwork, isLoading, role, refetch])

  const key = isDemoMode
    ? 'demo'
    : isConnected
      ? isCorrectNetwork
        ? role?.isEmployer
          ? 'employer'
          : role?.isWorker
            ? 'worker'
            : 'onboarding'
        : 'network'
      : 'connect'

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
        >
          {page}
        </motion.div>
      </AnimatePresence>
      <MissingConfigBanner />
    </>
  )
}
