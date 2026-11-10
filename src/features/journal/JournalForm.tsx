import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { firstFieldErrors, type FieldErrors } from '@/shared/lib/fieldErrors.ts'
import { useFocusFirstInvalid } from '@/shared/lib/useFocusOnChange.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { TextArea } from '@/shared/ui/TextArea.tsx'
import { TextField } from '@/shared/ui/TextField.tsx'
import { clearDraft, readDraft, saveDraft, type JournalDraft } from './draftStore.ts'
import { ACHIEVEMENT_MAX_LENGTH, REFLECTION_MAX_LENGTH, type Mood } from './mood.ts'
import { MoodSelector } from './MoodSelector.tsx'
import { entryContentSchema } from './schema.ts'
import type { JournalEntryContent } from './types.ts'

interface JournalFormProps {
  /** Contenido inicial (edición). Solo se lee al montar: el borrador es local. */
  initial?: JournalEntryContent | null
  /** Clave del borrador en memoria (usuario + fecha); ver draftStore. */
  draftKey: string
  moodLegend: string
  submitLabel: string
  savingLabel: string
  isSaving: boolean
  /** Error del último intento de guardado (backend o red). */
  error: Error | null
  /** Devuelve true solo si el backend confirmó el guardado. */
  onSubmit: (content: JournalEntryContent) => Promise<boolean>
  onCancel?: (() => void) | undefined
}

function sameContent(a: JournalDraft, b: JournalDraft): boolean {
  return a.mood === b.mood && a.reflection === b.reflection && a.achievement === b.achievement
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
  draftKey,
  moodLegend,
  submitLabel,
  savingLabel,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: JournalFormProps) {
  const [baseline] = useState<JournalDraft>(() => ({
    mood: initial?.mood ?? null,
    reflection: initial?.reflection ?? '',
    achievement: initial?.achievement ?? '',
  }))
  const [restoredDraft] = useState(() => readDraft(draftKey))
  const start = restoredDraft ?? baseline
  const [mood, setMood] = useState<Mood | null>(start.mood)
  const [reflection, setReflection] = useState(start.reflection)
  const [achievement, setAchievement] = useState(start.achievement)
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

  // Copia en memoria de lo escrito y aún no guardado (nunca en el almacenamiento del navegador).
  useEffect(() => {
    const draft = { mood, reflection, achievement }
    if (sameContent(draft, baseline)) clearDraft(draftKey)
    else saveDraft(draftKey, draft)
  }, [mood, reflection, achievement, baseline, draftKey])

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
      // El error, si lo hay, queda en el estado de la mutación y se muestra en la alerta.
      if (await onSubmit(result.data)) clearDraft(draftKey)
    } finally {
      submittingRef.current = false
    }
  }

  const handleCancel = () => {
    clearDraft(draftKey)
    onCancel?.()
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

      {restoredDraft && !error && (
        <InlineAlert tone="info">Hemos recuperado lo que estabas escribiendo y aún no se había guardado.</InlineAlert>
      )}

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
          <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
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
