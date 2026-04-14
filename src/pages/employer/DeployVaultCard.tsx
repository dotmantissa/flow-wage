import { useAccount, useChainId, useReadContract } from 'wagmi'
import { motion, useReducedMotion } from 'framer-motion'
import { PlusCircle } from 'lucide-react'
import { factoryContract } from '@/lib/contracts'
import { useDeployVault } from '@/hooks/useFlowWageFactory'

export function DeployVaultCard({ onDeployed }: { onDeployed: () => void }) {
  const reduce = useReducedMotion()
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
    <motion.div
      whileHover={reduce ? undefined : { y: -6 }}
      className="glass rounded-3xl border border-dashed border-[#A78BFA]/35 p-6"
    >
      <div className="flex items-center gap-2 text-lg font-semibold"><PlusCircle className="h-5 w-5 text-[#A78BFA]" /> Deploy Your Payroll Vault</div>
      <p className="mt-2 text-sm text-muted-foreground">One-time deployment for your employer vault. You only pay network gas.</p>
      <p className="mt-3 rounded-xl border border-[#A78BFA]/20 bg-black/20 px-3 py-2 font-mono text-xs text-muted-foreground">Predicted: {String(predictor.data ?? '...')}</p>
      <motion.button whileHover={reduce ? undefined : { scale: 1.03 }} whileTap={reduce ? undefined : { scale: 0.97 }} className="btn-primary mt-4" onClick={() => deploy()} disabled={isPending}>
        {isPending ? 'Deploying...' : 'Deploy Vault'}
      </motion.button>
    </motion.div>
  )
}
