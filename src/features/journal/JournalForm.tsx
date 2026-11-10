import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { firstFieldErrors, type FieldErrors } from '@/shared/lib/fieldErrors.ts'
import { useFocusFirstInvalid } from '@/shared/lib/useFocusOnChange.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { TextArea } from '@/shared/ui/TextArea.tsx'
import { TextField } from '@/shared/ui/TextField.tsx'
import { ACHIEVEMENT_MAX_LENGTH, REFLECTION_MAX_LENGTH, type Mood } from './mood.ts'
import { MoodSelector } from './MoodSelector.tsx'
import { entryContentSchema } from './schema.ts'
import type { JournalEntryContent } from './types.ts'

interface JournalFormProps {
  /** Contenido inicial (edición). Solo se lee al montar: el borrador es local. */
  initial?: JournalEntryContent | null
  moodLegend: string
  submitLabel: string
  savingLabel: string
  isSaving: boolean
  /** Error del último intento de guardado (backend o red). */
  error: Error | null
  onSubmit: (content: JournalEntryContent) => Promise<unknown>
  onCancel?: (() => void) | undefined
}

function errorMessage(error: Error): string {
  if (isAppError(error)) {
    if (error.code === 'ENTRY_CONFLICT' || error.code === 'ENTRY_NOT_FOUND') return error.message
    return `${error.message} Lo que has escrito sigue aquí.`
  }
  return `${ERROR_MESSAGES.UNKNOWN} Lo que has escrito sigue aquí.`
}

/**
 * Formulario de una entrada del diario. Conserva el borrador si el guardado
 * falla y bloquea envíos dobles mientras hay una petición en curso.
 */
export function JournalForm({
  initial,
  moodLegend,
  submitLabel,
  savingLabel,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: JournalFormProps) {
  const [mood, setMood] = useState<Mood | null>(initial?.mood ?? null)
  const [reflection, setReflection] = useState(initial?.reflection ?? '')
  const [achievement, setAchievement] = useState(initial?.achievement ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [attempt, setAttempt] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  // Evita dos envíos en el mismo instante, antes de que React vuelva a pintar.
  const submittingRef = useRef(false)
  const hintId = useId()

  useFocusFirstInvalid(formRef, attempt)

  useEffect(() => {
    if (error) alertRef.current?.focus()
  }, [error])

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submittingRef.current || isSaving) return

    const result = entryContentSchema.safeParse({ mood, reflection, achievement })
    if (!result.success) {
      setErrors(firstFieldErrors(result.error))
      setAttempt((n) => n + 1)
      return
    }
    setErrors({})
    submittingRef.current = true
    try {
      await onSubmit(result.data)
    } catch {
      // El error queda en el estado de la mutación y se muestra en la alerta.
    } finally {
      submittingRef.current = false
    }
  }

  const canSubmit = mood !== null

  return (
    <form ref={formRef} className="form journal-form" onSubmit={handleSubmit} noValidate aria-busy={isSaving || undefined}>
      <div className="journal-form__mood card">
        <MoodSelector legend={moodLegend} value={mood} onChange={setMood} disabled={isSaving} error={errors.mood} />
      </div>

      <TextArea
        label="¿Qué te gustaría recordar de este día?"
        name="reflection"
        optional
        rows={4}
        placeholder="Hoy ha pasado algo que me ha hecho pensar…"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        maxLength={REFLECTION_MAX_LENGTH}
        showCounter
        error={errors.reflection}
        readOnly={isSaving}
      />

      <TextField
        label="Un pequeño logro"
        hint="Puede ser algo pequeño: todos cuentan."
        name="achievement"
        optional
        placeholder="Hoy me he atrevido a…"
        value={achievement}
        onChange={(e) => setAchievement(e.target.value)}
        maxLength={ACHIEVEMENT_MAX_LENGTH}
        showCounter
        error={errors.achievement}
        readOnly={isSaving}
        autoComplete="off"
      />

      {error && (
        <InlineAlert ref={alertRef} tone="error">
          {errorMessage(error)}
        </InlineAlert>
      )}

      {!canSubmit && (
        <p className="journal-form__hint" id={hintId}>
          Elige cómo te has sentido para poder guardar.
        </p>
      )}

      <div className="btn-row">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          className="journal-form__submit"
          disabled={!canSubmit}
          isLoading={isSaving}
          loadingText={savingLabel}
          aria-describedby={canSubmit ? undefined : hintId}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
