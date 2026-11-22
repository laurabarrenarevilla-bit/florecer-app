import { describe, expect, it, vi } from 'vitest'
import { createAiClient } from './aiClient.ts'

const analysis = {
  summary: 'Resumen.',
  recurringThemes: [],
  achievements: [],
  reflectionQuestions: [],
  suggestedActions: [],
  disclaimer: 'Orientativo.',
}
const entries = [{ id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', updatedAt: '2026-11-20T10:00:00+00:00' }]

describe('createAiClient', () => {
  it('envía ids, versiones y consentimiento con el JWT, y valida la respuesta', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => Response.json({ data: analysis, meta: { entryCount: 1 } }))
    const client = createAiClient(async () => 'jwt-ficticio', fetchFn)
    expect(await client.analyzeWeek(entries)).toEqual(analysis)
    const [url, init] = fetchFn.mock.calls[0] ?? []
    expect(url).toBe('/api/ai/analyze')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer jwt-ficticio')
    expect(JSON.parse(String(init?.body))).toEqual({ period: '7d', entries, confirmed: true })
  })

  it('sin sesión no hace la petición', async () => {
    const fetchFn = vi.fn<typeof fetch>()
    await expect(createAiClient(async () => null, fetchFn).analyzeWeek(entries)).rejects.toMatchObject({ code: 'AUTH_REQUIRED' })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('propaga el código y el mensaje del servidor', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () =>
      Response.json({ error: { code: 'AI_RATE_LIMIT', message: 'Has alcanzado el límite.' } }, { status: 429 }),
    )
    await expect(createAiClient(async () => 't', fetchFn).analyzeWeek(entries)).rejects.toMatchObject({
      code: 'AI_RATE_LIMIT',
      message: 'Has alcanzado el límite.',
    })
  })

  it('error de red: mensaje de conexión', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(createAiClient(async () => 't', fetchFn).analyzeWeek(entries)).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' })
  })

  it('respuesta 200 con formato inesperado: no se muestra', async () => {
    const fetchFn = vi.fn<typeof fetch>(async () => Response.json({ data: { summary: 1 } }))
    await expect(createAiClient(async () => 't', fetchFn).analyzeWeek(entries)).rejects.toMatchObject({ code: 'AI_INVALID_RESPONSE' })
  })
})
