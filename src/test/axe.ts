import axe from 'axe-core'

/**
 * Ejecuta axe-core sobre el DOM de jsdom y devuelve las infracciones en un
 * formato legible. El contraste se desactiva aquí porque jsdom no calcula
 * estilos; se comprueba en navegador real (tests/e2e) y en la paleta SASS.
 * landmark-unique también: la barra lateral y la inferior comparten etiqueta
 * porque el CSS muestra solo una según el ancho, algo que jsdom no aplica.
 */
export async function axeViolations(root: Element = document.body): Promise<string[]> {
  const results = await axe.run(root, {
    rules: { 'color-contrast': { enabled: false }, 'landmark-unique': { enabled: false } },
    resultTypes: ['violations'],
  })
  return results.violations.map(
    (violation) => `${violation.id} (${violation.impact ?? 'sin impacto'}): ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
  )
}
