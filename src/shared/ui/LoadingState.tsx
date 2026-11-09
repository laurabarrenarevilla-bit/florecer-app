interface LoadingStateProps {
  label?: string
  fullscreen?: boolean
}

export function LoadingState({ label = 'Cargando…', fullscreen = false }: LoadingStateProps) {
  return (
    <div className={fullscreen ? 'loading loading--fullscreen' : 'loading'} role="status" aria-live="polite">
      <span className="loading__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
