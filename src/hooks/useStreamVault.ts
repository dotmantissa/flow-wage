import { useState } from 'react'
import { useAccount, useWaitForTransactionReceipt, useReadContract, useWriteContract } from 'wagmi'
import { toast } from 'sonner'
import { hashkeyTestnet } from '@/lib/chains'
import { vaultContract } from '@/lib/contracts'

export function formatContractError(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Transaction failed'
  if (raw.includes('KYCNotApproved')) return 'Employee KYC is not approved'
  if (raw.includes('TokenNotWhitelisted')) return 'Token is not whitelisted'
  if (raw.includes('InsufficientClaimable')) return 'Requested amount exceeds claimable balance'
  if (raw.includes('NotEmployee')) return 'Only the stream employee can perform this action'
  if (raw.includes('NotEmployer')) return 'Only the employer can perform this action'
  return raw
}

export function statusLabel(status: number): 'Active' | 'Paused' | 'Cancelled' | 'Ended' {
  if (status === 1) return 'Paused'
  if (status === 2) return 'Cancelled'
  if (status === 3) return 'Ended'
  return 'Active'
}

export function useStream(vault?: `0x${string}`, streamId?: bigint) {
  return useReadContract({
    ...(vault ? vaultContract(vault) : { address: undefined, abi: [] }),
    functionName: 'getStream',
    args: streamId !== undefined ? [streamId] : undefined,
    query: { enabled: !!vault && streamId !== undefined, refetchInterval: 5000 },
  })
}

export function useClaimableBalance(vault?: `0x${string}`, streamId?: bigint) {
  return useReadContract({
    ...(vault ? vaultContract(vault) : { address: undefined, abi: [] }),
    functionName: 'claimableBalance',
    args: streamId !== undefined ? [streamId] : undefined,
    query: { enabled: !!vault && streamId !== undefined, refetchInterval: 3000 },
  })
}

export function useEarnedBalance(vault?: `0x${string}`, streamId?: bigint) {
  return useReadContract({
    ...(vault ? vaultContract(vault) : { address: undefined, abi: [] }),
    functionName: 'earnedBalance',
    args: streamId !== undefined ? [streamId] : undefined,
    query: { enabled: !!vault && streamId !== undefined, refetchInterval: 3000 },
  })
}

export function useEmployeeStreams(vault?: `0x${string}`, address?: `0x${string}`) {
  return useReadContract({
    ...(vault ? vaultContract(vault) : { address: undefined, abi: [] }),
    functionName: 'employeeStreams',
    args: address ? [address] : undefined,
    query: { enabled: !!vault && !!address, refetchInterval: 10_000 },
  })
}

export function useNextStreamId(vault?: `0x${string}`) {
  return useReadContract({
    ...(vault ? vaultContract(vault) : { address: undefined, abi: [] }),
    functionName: 'nextStreamId',
    query: { enabled: !!vault, refetchInterval: 10_000 },
  })
}

function useTxAction() {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const receipt = useWaitForTransactionReceipt({ hash })

  const submit = async (
    request: {
      address: `0x${string}`
      abi: unknown
      functionName: string
      args?: readonly unknown[]
    },
    label: string,
  ) => {
    try {
      if (!address) throw new Error('Wallet not connected')
      const txHash = await writeContractAsync({
        ...request,
        account: address,
        chain: hashkeyTestnet,
      })
      setHash(txHash)
      await receipt.refetch()
      toast.success(`${label} confirmed · View on explorer: https://testnet-explorer.hsk.xyz/tx/${txHash}`)
      return txHash
    } catch (error) {
      toast.error(formatContractError(error))
      throw error
    }
  }

  return { submit, isPending: receipt.isLoading }
}

export function useCreateStream(vault?: `0x${string}`) {
  const action = useTxAction()
  return {
    createStream: async (params: {
      employee: `0x${string}`
      token: `0x${string}`
      totalDeposit: bigint
      startTime: bigint
      endTime: bigint
    }) => {
      if (!vault) return
      return action.submit({ ...vaultContract(vault), functionName: 'createStream', args: [params] }, 'Create stream')
    },
    isPending: action.isPending,
  }
}

export function useWithdrawAll(vault?: `0x${string}`) {
  const action = useTxAction()
  return {
    withdrawAll: async (streamId: bigint, to: `0x${string}`) => {
      if (!vault) return
      return action.submit({ ...vaultContract(vault), functionName: 'withdrawAll', args: [streamId, to] }, 'Withdraw all')
    },
    isPending: action.isPending,
  }
}

export function usePauseStream(vault?: `0x${string}`) {
  const action = useTxAction()
  return {
    pauseStream: async (streamId: bigint) => {
      if (!vault) return
      return action.submit({ ...vaultContract(vault), functionName: 'pauseStream', args: [streamId] }, 'Pause stream')
    },
    isPending: action.isPending,
  }
}

export function useResumeStream(vault?: `0x${string}`) {
  const action = useTxAction()
  return {
    resumeStream: async (streamId: bigint) => {
      if (!vault) return
      return action.submit({ ...vaultContract(vault), functionName: 'resumeStream', args: [streamId] }, 'Resume stream')
    },
    isPending: action.isPending,
  }
}

export function useCancelStream(vault?: `0x${string}`) {
  const action = useTxAction()
  return {
    cancelStream: async (streamId: bigint) => {
      if (!vault) return
      return action.submit({ ...vaultContract(vault), functionName: 'cancelStream', args: [streamId] }, 'Cancel stream')
    },
    isPending: action.isPending,
  }
}

export function useTopUpStream(vault?: `0x${string}`) {
  const action = useTxAction()
  return {
    topUpStream: async (streamId: bigint, additionalAmount: bigint) => {
      if (!vault) return
      return action.submit(
        { ...vaultContract(vault), functionName: 'topUpStream', args: [streamId, additionalAmount] },
        'Top up stream',
      )
    },
    isPending: action.isPending,
  }
}
