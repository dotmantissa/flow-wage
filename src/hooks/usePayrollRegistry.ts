import { useChainId, useReadContract } from 'wagmi'
import { registryContract } from '@/lib/contracts'

export function useIsEmployerActive(address?: `0x${string}`) {
  const chainId = useChainId()
  return useReadContract({
    ...registryContract(chainId),
    functionName: 'isEmployerActive',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useIsKYCApproved(address?: `0x${string}`) {
  const chainId = useChainId()
  return useReadContract({
    ...registryContract(chainId),
    functionName: 'isKYCApproved',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useKYCStatus(address?: `0x${string}`) {
  const chainId = useChainId()
  return useReadContract({
    ...registryContract(chainId),
    functionName: 'getKYCStatus',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

export function useIsTokenWhitelisted(token?: `0x${string}`) {
  const chainId = useChainId()
  return useReadContract({
    ...registryContract(chainId),
    functionName: 'isTokenWhitelisted',
    args: token ? [token] : undefined,
    query: { enabled: !!token },
  })
}
