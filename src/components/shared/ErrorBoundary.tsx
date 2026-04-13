import React from 'react'
import { useAppStore } from '@/store/useAppStore'

type Props = React.PropsWithChildren<{ title: string }>

type State = { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="mx-auto mt-20 max-w-xl rounded-xl border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold">{this.props.title}</h2>
        <p className="mt-2 text-muted-foreground">{this.state.message}</p>
        <button
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => {
            useAppStore.getState().clearSession()
            window.location.reload()
          }}
        >
          Try Again
        </button>
      </div>
    )
  }
}
