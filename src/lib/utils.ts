import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address?: `0x${string}`) {
  if (!address) return '0x0000...0000'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatUSDT(value: bigint | number) {
  const num = typeof value === 'bigint' ? Number(value) / 1e6 : value
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(num)
}
