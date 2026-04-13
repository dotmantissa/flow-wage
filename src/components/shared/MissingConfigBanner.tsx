import { getMissingAddresses } from '@/lib/contracts'

export function MissingConfigBanner() {
  const missing = getMissingAddresses()
  if (missing.length === 0) return null
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-lg bg-destructive/90 p-3 text-sm text-white">
      Missing contract addresses: {missing.join(', ')} - check your .env file
    </div>
  )
}
