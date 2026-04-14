import { useChainId, useSwitchChain } from 'wagmi'
import { hashkeyTestnet } from '@/lib/chains'

export function useNetworkGuard() {
  const currentChainId = useChainId()
  const { switchChainAsync, isPending } = useSwitchChain()
  const isCorrectNetwork = currentChainId === hashkeyTestnet.id

  const switchToHashKey = async () => {
    try {
      await switchChainAsync({ chainId: hashkeyTestnet.id })
      return
    } catch {
      const ethereum = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
      if (!ethereum) throw new Error('No wallet provider found')

      const chainHex = `0x${hashkeyTestnet.id.toString(16)}`

      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainHex }],
        })
        return
      } catch (switchError) {
        const code = (switchError as { code?: number })?.code
        if (code !== 4902) throw switchError

        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainHex,
              chainName: hashkeyTestnet.name,
              nativeCurrency: hashkeyTestnet.nativeCurrency,
              rpcUrls: [hashkeyTestnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [hashkeyTestnet.blockExplorers?.default.url],
            },
          ],
        })

        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainHex }],
        })
      }
    }
  }

  return {
    isCorrectNetwork,
    switchToHashKey,
    isSwitching: isPending,
    currentChainId,
  }
}
