import { useId } from 'react'
import { EMOTION_LABELS, MAX_EMOTIONS, emotionsForMood, type Emotion } from './emotions.ts'
import { MOOD_LABELS, type Mood } from './mood.ts'

interface EmotionPickerProps {
  mood: Mood
  value: readonly Emotion[]
  onChange: (emotions: Emotion[]) => void
  disabled?: boolean
  error?: string | undefined
}

/**
 * Emociones secundarias del ánimo elegido (ADR-011). Casillas nativas con
 * aspecto de chip: hasta MAX_EMOTIONS; al llegar al máximo, el resto se
 * deshabilita y se explica por qué.
 */
export function EmotionPicker({ mood, value, onChange, disabled = false, error }: EmotionPickerProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const atMax = value.length >= MAX_EMOTIONS

  const toggle = (emotion: Emotion) => {
    onChange(value.includes(emotion) ? value.filter((e) => e !== emotion) : [...value, emotion])
  }

  return (
    <fieldset
      className={`emotion-picker emotion-picker--${mood}`}
      disabled={disabled}
      aria-describedby={[hintId, error ? errorId : ''].filter(Boolean).join(' ')}
      aria-invalid={error ? true : undefined}
    >
      <legend className="emotion-picker__legend">
        ¿Algo más concreto?
        <span className="field__optional">Opcional</span>
      </legend>
      <p className="emotion-picker__hint" id={hintId}>
        {atMax
          ? `Has elegido ${MAX_EMOTIONS}, el máximo. Quita una para elegir otra.`
          : `Emociones de «${MOOD_LABELS[mood]}». Puedes elegir hasta ${MAX_EMOTIONS}.`}
      </p>
      <div className="emotion-picker__options">
        {emotionsForMood(mood).map((emotion) => {
          const checked = value.includes(emotion)
          return (
            <label key={emotion} className="emotion-picker__option">
              <input
                className="emotion-picker__input"
                type="checkbox"
                value={emotion}
                checked={checked}
                disabled={!checked && atMax}
                onChange={() => toggle(emotion)}
              />
              <span className="emotion-picker__label">{EMOTION_LABELS[emotion]}</span>
            </label>
          )
        })}
      </div>
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </fieldset>
  )
}
