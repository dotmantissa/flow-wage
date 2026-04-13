import { maxUint256 } from 'viem'
import { useState } from 'react'
import { useAccount, useChainId, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { toast } from 'sonner'
import { hashkeyTestnet } from '@/lib/chains'
import { erc20Contract, getAddresses } from '@/lib/contracts'

export function useTokenBalance(token?: `0x${string}`) {
  const { address } = useAccount()
  return useReadContract({
    ...(token ? erc20Contract(token) : { address: undefined, abi: [] }),
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!token && !!address },
  })
}

export function useTokenAllowance(token?: `0x${string}`, spender?: `0x${string}`) {
  const { address } = useAccount()
  return useReadContract({
    ...(token ? erc20Contract(token) : { address: undefined, abi: [] }),
    functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
    query: { enabled: !!token && !!address && !!spender },
  })
}

export function useApproveToken(token?: `0x${string}`, spender?: `0x${string}`) {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const receipt = useWaitForTransactionReceipt({ hash })

  const approve = async (amount?: bigint) => {
    if (!token || !spender || !address) return
    const txHash = await writeContractAsync({
      ...erc20Contract(token),
      functionName: 'approve',
      args: [spender, amount ?? maxUint256],
      account: address,
      chain: hashkeyTestnet,
    })
    setHash(txHash)
    await receipt.refetch()
    toast.success(`Approval confirmed · View on explorer: https://testnet-explorer.hsk.xyz/tx/${txHash}`)
  }

  return { approve, isPending: receipt.isLoading }
}

export function useMintMockUSDT() {
  const chainId = useChainId()
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const [hash, setHash] = useState<`0x${string}` | undefined>()
  const receipt = useWaitForTransactionReceipt({ hash })

  const mint = async (amount: bigint) => {
    if (!address) return
    const token = getAddresses(chainId).usdt
    const txHash = await writeContractAsync({
      ...erc20Contract(token),
      functionName: 'mint',
      args: [address, amount],
      account: address,
      chain: hashkeyTestnet,
    })
    setHash(txHash)
    await receipt.refetch()
    toast.success(`Mint confirmed · View on explorer: https://testnet-explorer.hsk.xyz/tx/${txHash}`)
  }

  return { mint, isPending: receipt.isLoading }
}
