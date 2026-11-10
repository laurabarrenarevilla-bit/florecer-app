import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createJournalRepository } from './journalRepository.ts'

describe('journalRepository sin conexión', () => {
  afterEach(() => vi.restoreAllMocks())

  it('falla al momento con NETWORK_UNAVAILABLE y no llama a Supabase', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const getClient = vi.fn((): SupabaseClient => {
      throw new Error('no debería llamarse')
    })
    const repository = createJournalRepository(getClient)

    await expect(repository.getByDate('2026-11-10')).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' })
    await expect(repository.listBetween('2026-11-01', '2026-11-30')).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' })
    await expect(
      repository.create({ date: '2026-11-10', mood: 'happy', reflection: '', achievement: '' }),
    ).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' })
    await expect(repository.deleteByDate('2026-11-10')).rejects.toMatchObject({ code: 'NETWORK_UNAVAILABLE' })
    expect(getClient).not.toHaveBeenCalled()
  })
})
