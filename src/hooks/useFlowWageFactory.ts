import { useState } from 'react'
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { toast } from 'sonner'
import { hashkeyTestnet } from '@/lib/chains'
import { factoryContract } from '@/lib/contracts'

export function useHasVault(address?: `0x${string}`) {
  const chainId = useChainId()
  return useReadContract({
    ...factoryContract(chainId),
    functionName: 'hasVault',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useGetVault(address?: `0x${string}`) {
  const chainId = useChainId()
  return useReadContract({
    ...factoryContract(chainId),
    functionName: 'getVault',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useDeployVault(onSuccess?: () => void) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { writeContractAsync } = useWriteContract()
  const [hash, setHash] = useState<`0x${string}` | undefined>()

  const receipt = useWaitForTransactionReceipt({ hash })

  const deploy = async () => {
    try {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await writeContractAsync({
        ...factoryContract(chainId),
        functionName: 'deployVault',
        account: address,
        chain: hashkeyTestnet,
      })
      setHash(txHash)
      const receiptResult = await receipt.refetch()
      const finalHash = receiptResult.data?.transactionHash ?? txHash
      toast.success(`Vault deployed successfully · View on explorer: https://testnet-explorer.hsk.xyz/tx/${finalHash}`)
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deploy vault'
      toast.error(message)
      throw error
    }
  }

  return {
    deploy,
    isPending: receipt.isLoading,
    txHash: hash,
  }
}
