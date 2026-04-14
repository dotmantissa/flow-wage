import { createConfig, http } from 'wagmi'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { hashkeyTestnet } from '@/lib/chains'

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

const connectors = [
  injected(),
  coinbaseWallet({
    appName: 'Flow | WAGE',
  }),
]

if (walletConnectProjectId) {
  connectors.push(
    walletConnect({
      projectId: walletConnectProjectId,
      showQrModal: true,
    }),
  )
}

export const wagmiConfig = createConfig({
  chains: [hashkeyTestnet],
  connectors,
  transports: {
    [hashkeyTestnet.id]: http(import.meta.env.VITE_RPC_URL || 'https://testnet.hsk.xyz'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
