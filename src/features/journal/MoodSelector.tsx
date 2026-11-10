import { useId } from 'react'
import { MoodIcon } from './MoodIcon.tsx'
import { MOOD_LABELS, MOODS, type Mood } from './mood.ts'

interface MoodSelectorProps {
  legend: string
  value: Mood | null
  onChange: (mood: Mood) => void
  disabled?: boolean
  error?: string | undefined
}

/**
 * Grupo de radios nativos con aspecto de tarjeta: navegación con flechas,
 * anuncio de "seleccionado" y etiqueta de grupo sin ARIA adicional.
 */
export function MoodSelector({ legend, value, onChange, disabled = false, error }: MoodSelectorProps) {
  const name = useId()
  const errorId = `${name}-error`

  return (
    <fieldset
      className="mood-selector"
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mood-selector__legend">{legend}</legend>
      <div className="mood-selector__options">
        {MOODS.map((mood) => (
          <label key={mood} className={`mood-selector__option mood-selector__option--${mood}`}>
            <input
              className="mood-selector__input"
              type="radio"
              name={name}
              value={mood}
              checked={value === mood}
              onChange={() => onChange(mood)}
            />
            <MoodIcon mood={mood} />
            <span className="mood-selector__label">{MOOD_LABELS[mood]}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </fieldset>
  )
}
