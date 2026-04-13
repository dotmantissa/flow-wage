import { createConfig, http } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { hashkeyTestnet } from '@/lib/chains'

export const wagmiConfig = createConfig({
  chains: [hashkeyTestnet],
  connectors: [injected(), metaMask()],
  transports: {
    [hashkeyTestnet.id]: http(import.meta.env.VITE_RPC_URL || 'https://testnet.hsk.xyz'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
