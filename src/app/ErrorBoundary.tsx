import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Brand } from '@/shared/ui/Brand.tsx'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

/**
 * Último recurso ante un error de renderizado: pantalla comprensible en vez de
 * una página en blanco. No registra el error con datos de la persona.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Solo el tipo de error y la pila de componentes: nunca props ni contenido.
    console.error('Error de interfaz:', error.name, info.componentStack)
  }

  override render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="centered-page not-found" role="alert">
        <Brand size="lg" />
        <h1 className="not-found__title">Algo no ha ido bien</h1>
        <p className="not-found__text">
          Ha ocurrido un error inesperado en la aplicación. Lo que ya estaba guardado sigue a salvo en tu cuenta.
        </p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Recargar la página
        </button>
        <a className="btn btn--ghost" href="/">
          Ir al inicio
        </a>
      </main>
    )
  }
}
