import type { JournalEntry } from '@/features/journal/types.ts'

/**
 * Palabras frecuentes de las reflexiones (docs/13). Conteo real por código:
 * normalización Unicode, minúsculas es-ES, segmentación por palabras,
 * palabras vacías del español, mínimo 3 letras y sin números. Para contar se
 * ignoran las tildes ("día" = "dia"), pero se muestra la forma más escrita.
 */

// Palabras vacías frecuentes (artículos, preposiciones, pronombres, auxiliares…).
const STOPWORDS = new Set(
  `que los las del por con una uno unos unas para como más mas pero sus les este esta esto estos estas ese esa eso esos esas
  aquel aquella aquello son sin sobre tambien también muy hay han has hemos habia había habían ser fue fui era eran sido estar
  estoy esta está estaba estaban estado estamos estuve estuvo tener tengo tiene tenía tenia tenido hacer hecho hice hizo hago hace
  ir voy vamos iba fue cuando donde dónde quien quién cual cuál porque porqué qué todo toda todos todas nada algo alguien nadie
  otro otra otros otras mismo misma ella ellos ellas ellas nosotros vosotros usted ustedes mío mio mía mia tuyo suyo nuestro
  nuestra entre hasta desde durante ante tras contra hacia segun según mientras aunque luego así asi ahora antes después despues
  siempre nunca también tampoco solo sólo bien mal mucho mucha muchos muchas poco poca pocos pocas tan tanto cada ya aún aun
  hoy ayer mañana manana día dia días dias vez veces cosa cosas parte puede pueden podía podia poder quiero quería queria
  sido sea sean ese esa algún algun alguna algunos algunas ningún ningun ninguna nos ese mis tus del los the and`.split(/\s+/),
)

export const MIN_REFLECTIONS_FOR_WORDS = 3

export interface WordCount {
  word: string
  count: number
}

function stripAccents(word: string): string {
  // Se conserva la ñ: "año" y "ano" son palabras distintas.
  return word.normalize('NFD').replace(/(?!̃)[̀-ͯ]/g, '').normalize('NFC')
}

const segmenter = new Intl.Segmenter('es', { granularity: 'word' })

/** Devuelve [] si hay menos de MIN_REFLECTIONS_FOR_WORDS reflexiones con texto. */
export function frequentWords(entries: readonly JournalEntry[], limit = 8): WordCount[] {
  const reflections = entries.map((e) => e.reflection.trim()).filter(Boolean)
  if (reflections.length < MIN_REFLECTIONS_FOR_WORDS) return []

  const counts = new Map<string, { count: number; forms: Map<string, number> }>()
  for (const text of reflections) {
    for (const { segment, isWordLike } of segmenter.segment(text.normalize('NFC').toLocaleLowerCase('es-ES'))) {
      if (!isWordLike || segment.length < 3 || /\d/.test(segment)) continue
      const key = stripAccents(segment)
      if (STOPWORDS.has(segment) || STOPWORDS.has(key)) continue
      const current = counts.get(key) ?? { count: 0, forms: new Map<string, number>() }
      current.count += 1
      current.forms.set(segment, (current.forms.get(segment) ?? 0) + 1)
      counts.set(key, current)
    }
  }

  return [...counts.values()]
    .filter((c) => c.count >= 2)
    .map((c) => {
      const [word] = [...c.forms.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))[0] ?? ['']
      return { word, count: c.count }
    })
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'es'))
    .slice(0, limit)
}
