import { useAccount, useChainId, useReadContract } from 'wagmi'
import { factoryContract } from '@/lib/contracts'
import { useDeployVault } from '@/hooks/useFlowWageFactory'

export function DeployVaultCard({ onDeployed }: { onDeployed: () => void }) {
  const { address } = useAccount()
  const chainId = useChainId()
  const predictor = useReadContract({
    ...factoryContract(chainId),
    functionName: 'computeVaultAddress',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
  const { deploy, isPending } = useDeployVault(onDeployed)

  return (
    <div className="rounded-xl border border-dashed bg-card p-6">
      <h3 className="text-lg font-semibold">Deploy Your Payroll Vault</h3>
      <p className="mt-2 text-sm text-muted-foreground">Vault deployment is one-time and costs only network gas.</p>
      <p className="mt-3 text-xs text-muted-foreground">Predicted: {String(predictor.data ?? '...')}</p>
      <button className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => deploy()} disabled={isPending}>
        {isPending ? 'Deploying...' : 'Deploy Vault'}
      </button>
    </div>
  )
}
