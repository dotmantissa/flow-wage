import { useEffect, useMemo, useRef } from 'react'
import { useAccount, useChainId, useReadContract, useReadContracts } from 'wagmi'
import { factoryContract, registryContract } from '@/lib/contracts'
import { useAppStore } from '@/store/useAppStore'
import type { UserRole } from '@/types/contracts'

export function useUserRole() {
  const { address } = useAccount()
  const chainId = useChainId()
  const prevAddressRef = useRef<`0x${string}` | undefined>(undefined)

  const userRole = useAppStore((s) => s.userRole)
  const setUserRole = useAppStore((s) => s.setUserRole)
  const setVaultAddress = useAppStore((s) => s.setVaultAddress)

  const registry = registryContract(chainId)
  const factory = factoryContract(chainId)

  const roleReads = useReadContracts({
    contracts: address
      ? [
          { ...registry, functionName: 'isEmployerActive', args: [address] },
          { ...registry, functionName: 'isKYCApproved', args: [address] },
          { ...factory, functionName: 'hasVault', args: [address] },
        ]
      : [],
    query: { enabled: !!address },
  })

  const hasVault = Boolean(roleReads.data?.[2]?.result)

  const vaultRead = useReadContract({
    ...factory,
    functionName: 'getVault',
    args: address ? [address] : undefined,
    query: { enabled: !!address && hasVault },
  })

  useEffect(() => {
    if (prevAddressRef.current && prevAddressRef.current !== address) {
      setUserRole(null)
      setVaultAddress(null)
    }
    prevAddressRef.current = address
  }, [address, setUserRole, setVaultAddress])

  const role = useMemo<UserRole | null>(() => {
    if (!address || !roleReads.data) return null

    const isEmployer = Boolean(roleReads.data[0]?.result)
    const kycApproved = Boolean(roleReads.data[1]?.result)
    const hasVaultLocal = Boolean(roleReads.data[2]?.result)
    const vaultAddress = hasVaultLocal ? (vaultRead.data as `0x${string}`) : null

    return {
      isEmployer,
      isWorker: kycApproved,
      kycApproved,
      hasVault: hasVaultLocal,
      vaultAddress,
    }
  }, [address, roleReads.data, vaultRead.data])

  useEffect(() => {
    if (role) {
      setUserRole(role)
      setVaultAddress(role.vaultAddress)
    }
  }, [role, setUserRole, setVaultAddress])

  const isLoading = !userRole && (roleReads.isLoading || roleReads.isFetching || vaultRead.isLoading)

  return {
    role: role ?? userRole,
    isLoading,
    refetch: async () => {
      await roleReads.refetch()
      await vaultRead.refetch()
    },
  }
}
