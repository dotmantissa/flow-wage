export const KYCStatus = {
  Unverified: 0,
  Pending: 1,
  Approved: 2,
  Revoked: 3,
} as const

export const EmployerStatus = {
  Unregistered: 0,
  Active: 1,
  Suspended: 2,
} as const

export const StreamStatus = {
  Active: 0,
  Paused: 1,
  Cancelled: 2,
  Ended: 3,
} as const

export interface Stream {
  id: bigint
  employer: `0x${string}`
  employee: `0x${string}`
  token: `0x${string}`
  totalDeposit: bigint
  withdrawn: bigint
  scaledRate: bigint
  startTime: bigint
  endTime: bigint
  status: number
}

export interface StreamParams {
  employee: `0x${string}`
  token: `0x${string}`
  totalDeposit: bigint
  startTime: bigint
  endTime: bigint
}

export interface UserRole {
  isEmployer: boolean
  isWorker: boolean
  kycApproved: boolean
  hasVault: boolean
  vaultAddress: `0x${string}` | null
}
