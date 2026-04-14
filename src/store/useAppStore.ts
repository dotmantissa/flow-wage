import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/contracts'

type AppState = {
  userRole: UserRole | null
  vaultAddress: `0x${string}` | null
  workerVaults: `0x${string}`[]
  activeStreamId: bigint | null
  preferredMode: 'employer' | 'worker' | 'both' | null
  isDemoMode: boolean
  lastConnectedAddress: `0x${string}` | null
  setUserRole: (role: UserRole | null) => void
  setVaultAddress: (address: `0x${string}` | null) => void
  addWorkerVault: (address: `0x${string}`) => void
  removeWorkerVault: (address: `0x${string}`) => void
  setActiveStreamId: (id: bigint | null) => void
  setPreferredMode: (mode: 'employer' | 'worker' | 'both' | null) => void
  setDemoMode: (enabled: boolean) => void
  setLastConnectedAddress: (address: `0x${string}` | null) => void
  clearSession: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userRole: null,
      vaultAddress: null,
      workerVaults: [],
      activeStreamId: null,
      preferredMode: null,
      isDemoMode: false,
      lastConnectedAddress: null,
      setUserRole: (userRole) => set({ userRole }),
      setVaultAddress: (vaultAddress) => set({ vaultAddress }),
      addWorkerVault: (address) =>
        set((state) => ({
          workerVaults: state.workerVaults.includes(address) ? state.workerVaults : [address, ...state.workerVaults],
        })),
      removeWorkerVault: (address) =>
        set((state) => ({
          workerVaults: state.workerVaults.filter((item) => item !== address),
          vaultAddress: state.vaultAddress === address ? null : state.vaultAddress,
        })),
      setActiveStreamId: (activeStreamId) => set({ activeStreamId }),
      setPreferredMode: (preferredMode) => set({ preferredMode }),
      setDemoMode: (isDemoMode) => set({ isDemoMode }),
      setLastConnectedAddress: (lastConnectedAddress) => set({ lastConnectedAddress }),
      clearSession: () =>
        set({
          userRole: null,
          vaultAddress: null,
          workerVaults: [],
          activeStreamId: null,
          preferredMode: null,
        }),
    }),
    {
      name: 'flowwage-store',
      partialize: (state) => ({
        isDemoMode: state.isDemoMode,
        lastConnectedAddress: state.lastConnectedAddress,
        preferredMode: state.preferredMode,
        workerVaults: state.workerVaults,
      }),
    },
  ),
)
