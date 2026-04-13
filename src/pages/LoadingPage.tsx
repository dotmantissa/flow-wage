import { useEffect, useState } from 'react'

export function LoadingPage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(id)
  }, [])

  if (!visible) return null

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4">
      <h1 className="font-mono text-4xl">Flow <span className="text-primary">|</span> WAGE</h1>
      <div className="mt-6 w-full space-y-3">
        <div className="h-3 w-full animate-pulse rounded bg-secondary" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-secondary" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Reading your access level from HashKey Chain</p>
    </div>
  )
}
