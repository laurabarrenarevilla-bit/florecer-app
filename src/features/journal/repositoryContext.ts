import { createContext, useContext } from 'react'
import { journalRepository, type JournalRepository } from './journalRepository.ts'

/**
 * Repositorio del diario inyectable. En la aplicación se usa el real (Supabase);
 * las pruebas de componentes proporcionan uno en memoria.
 */
export const JournalRepositoryContext = createContext<JournalRepository>(journalRepository)

export function useJournalRepository(): JournalRepository {
  return useContext(JournalRepositoryContext)
}
