import { useChainId, useSwitchChain } from 'wagmi'
import { hashkeyTestnet } from '@/lib/chains'

export function useNetworkGuard() {
  const currentChainId = useChainId()
  const { switchChainAsync, isPending } = useSwitchChain()
  const isCorrectNetwork = currentChainId === hashkeyTestnet.id

  const switchToHashKey = async () => {
    await switchChainAsync({ chainId: hashkeyTestnet.id })
  }

  return {
    isCorrectNetwork,
    switchToHashKey,
    isSwitching: isPending,
    currentChainId,
  }
}
