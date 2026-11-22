import { useState } from 'react'
import { Button } from '@/shared/ui/Button.tsx'
import { INTROSPECTION_PROMPTS, initialPromptIndex, nextPromptIndex } from './introspection.ts'

interface IntrospectionPromptProps {
  /** Semilla de la primera pregunta (p. ej. la clave del borrador). */
  seed: string
  /** id para que el campo de reflexión se describa con la pregunta. */
  id: string
}

/** Pregunta orientativa sobre la reflexión, con opción de pedir otra. */
export function IntrospectionPrompt({ seed, id }: IntrospectionPromptProps) {
  const [index, setIndex] = useState(() => initialPromptIndex(seed))

  return (
    <div className="introspection">
      <p className="introspection__eyebrow">Una pregunta, por si te ayuda</p>
      <p className="introspection__question" id={id} aria-live="polite">
        {INTROSPECTION_PROMPTS[index]}
      </p>
      <Button variant="ghost" className="introspection__next" onClick={() => setIndex(nextPromptIndex)}>
        Otra pregunta
      </Button>
    </div>
  )
}
