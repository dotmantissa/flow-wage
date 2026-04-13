import PayrollRegistryAbi from '@/lib/abis/PayrollRegistry.json'
import FactoryAbi from '@/lib/abis/FlowWageFactory.json'
import StreamVaultAbi from '@/lib/abis/StreamVault.json'
import ERC20Abi from '@/lib/abis/ERC20.json'

export type AddressMap = {
  registry: `0x${string}`
  factory: `0x${string}`
  gateway: `0x${string}`
  usdt: `0x${string}`
  hsp: `0x${string}`
}

const zero = '0x0000000000000000000000000000000000000000' as `0x${string}`

export function getAddresses(chainId: number): AddressMap {
  void chainId
  const addresses: AddressMap = {
    registry: (import.meta.env.VITE_REGISTRY_ADDRESS || zero) as `0x${string}`,
    factory: (import.meta.env.VITE_FACTORY_ADDRESS || zero) as `0x${string}`,
    gateway: (import.meta.env.VITE_GATEWAY_ADDRESS || zero) as `0x${string}`,
    usdt: (import.meta.env.VITE_USDT_ADDRESS || zero) as `0x${string}`,
    hsp: (import.meta.env.VITE_HSP_ADDRESS || zero) as `0x${string}`,
  }

  const missing = getMissingAddresses()
  if (missing.length > 0) {
    console.warn('Flow|WAGE missing VITE addresses:', missing.join(', '))
  }

  return addresses
}

export function getMissingAddresses(): string[] {
  const entries = [
    ['VITE_REGISTRY_ADDRESS', import.meta.env.VITE_REGISTRY_ADDRESS],
    ['VITE_FACTORY_ADDRESS', import.meta.env.VITE_FACTORY_ADDRESS],
    ['VITE_GATEWAY_ADDRESS', import.meta.env.VITE_GATEWAY_ADDRESS],
    ['VITE_USDT_ADDRESS', import.meta.env.VITE_USDT_ADDRESS],
    ['VITE_HSP_ADDRESS', import.meta.env.VITE_HSP_ADDRESS],
  ] as const

  return entries.filter(([, value]) => !value || value === zero).map(([key]) => key)
}

export function registryContract(chainId: number) {
  return { address: getAddresses(chainId).registry, abi: PayrollRegistryAbi }
}

export function factoryContract(chainId: number) {
  return { address: getAddresses(chainId).factory, abi: FactoryAbi }
}

export function vaultContract(vaultAddress: `0x${string}`) {
  return { address: vaultAddress, abi: StreamVaultAbi }
}

export function erc20Contract(tokenAddress: `0x${string}`) {
  return { address: tokenAddress, abi: ERC20Abi }
}
