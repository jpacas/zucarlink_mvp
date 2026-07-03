import { Component, type ErrorInfo, type ReactNode } from 'react'

import { captureException } from '../lib/sentry'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureException(error)
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="content-card stack" style={{ maxWidth: 480, margin: '64px auto' }}>
          <h2>Algo salió mal</h2>
          <p className="error-text">
            Ocurrió un error inesperado. Recargá la página para continuar; si el problema
            persiste, contactanos.
          </p>
          <div className="actions">
            <button
              type="button"
              className="button"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
