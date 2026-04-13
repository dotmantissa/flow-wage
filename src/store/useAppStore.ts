import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types/contracts'

type AppState = {
  userRole: UserRole | null
  vaultAddress: `0x${string}` | null
  activeStreamId: bigint | null
  isDemoMode: boolean
  lastConnectedAddress: `0x${string}` | null
  setUserRole: (role: UserRole | null) => void
  setVaultAddress: (address: `0x${string}` | null) => void
  setActiveStreamId: (id: bigint | null) => void
  setDemoMode: (enabled: boolean) => void
  setLastConnectedAddress: (address: `0x${string}` | null) => void
  clearSession: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userRole: null,
      vaultAddress: null,
      activeStreamId: null,
      isDemoMode: false,
      lastConnectedAddress: null,
      setUserRole: (userRole) => set({ userRole }),
      setVaultAddress: (vaultAddress) => set({ vaultAddress }),
      setActiveStreamId: (activeStreamId) => set({ activeStreamId }),
      setDemoMode: (isDemoMode) => set({ isDemoMode }),
      setLastConnectedAddress: (lastConnectedAddress) => set({ lastConnectedAddress }),
      clearSession: () =>
        set({
          userRole: null,
          vaultAddress: null,
          activeStreamId: null,
        }),
    }),
    {
      name: 'flowwage-store',
      partialize: (state) => ({
        isDemoMode: state.isDemoMode,
        lastConnectedAddress: state.lastConnectedAddress,
      }),
    },
  ),
)
