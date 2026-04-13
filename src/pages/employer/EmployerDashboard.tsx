import { useAccount } from 'wagmi'
import { AppHeader } from '@/components/layout/AppHeader'
import { useGetVault } from '@/hooks/useFlowWageFactory'
import { useAppStore } from '@/store/useAppStore'
import { DeployVaultCard } from '@/pages/employer/DeployVaultCard'
import { StatsRow } from '@/pages/employer/StatsRow'
import { CreateStreamForm } from '@/pages/employer/CreateStreamForm'
import { StreamsTable } from '@/pages/employer/StreamsTable'

export function EmployerDashboard() {
  const { address } = useAccount()
  const storeVault = useAppStore((s) => s.vaultAddress)
  const setVaultAddress = useAppStore((s) => s.setVaultAddress)
  const vaultRead = useGetVault(address)

  const vault = ((vaultRead.data as `0x${string}` | undefined) || storeVault) as `0x${string}` | null
  if (vault && vault !== storeVault) setVaultAddress(vault)

  return (
    <div>
      <AppHeader role="Employer" />
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6">
        {!vault ? <DeployVaultCard onDeployed={() => vaultRead.refetch()} /> : null}
        {vault ? (
          <>
            <StatsRow vault={vault} />
            <CreateStreamForm vault={vault} />
            <StreamsTable vault={vault} />
          </>
        ) : null}
      </main>
    </div>
  )
}
