import { defineChain } from 'viem'

export const hashkeyTestnet = defineChain({
  id: 133,
  name: 'HashKey Chain Testnet',
  nativeCurrency: { name: 'HSK', symbol: 'HSK', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_URL || 'https://testnet.hsk.xyz'] },
  },
  blockExplorers: {
    default: { name: 'HashKey Explorer', url: 'https://testnet-explorer.hsk.xyz' },
  },
  testnet: true,
})
