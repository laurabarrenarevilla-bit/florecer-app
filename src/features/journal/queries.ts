import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/authContext.ts'
import type { LocalDate } from '@/shared/lib/dates.ts'
import { isAppError } from '@/shared/lib/errors.ts'
import { useJournalRepository } from './repositoryContext.ts'
import type { CreateJournalEntryInput, JournalEntry, UpdateJournalEntryInput } from './types.ts'

/**
 * Claves de caché. Todas cuelgan de ['entries', userId] para invalidar Hoy y
 * el calendario a la vez, y para no mezclar datos entre cuentas.
 */
export const entryKeys = {
  all: (userId: string) => ['entries', userId] as const,
  day: (userId: string, date: LocalDate) => ['entries', userId, 'day', date] as const,
  range: (userId: string, from: LocalDate, to: LocalDate) => ['entries', userId, 'range', from, to] as const,
}

export function useEntryByDate(date: LocalDate) {
  const { id: userId } = useCurrentUser()
  const repository = useJournalRepository()
  return useQuery({
    queryKey: entryKeys.day(userId, date),
    queryFn: () => repository.getByDate(date),
  })
}

export function useEntriesBetween(from: LocalDate, to: LocalDate) {
  const { id: userId } = useCurrentUser()
  const repository = useJournalRepository()
  return useQuery({
    queryKey: entryKeys.range(userId, from, to),
    queryFn: () => repository.listBetween(from, to),
  })
}

/** Errores tras los que la versión en caché ya no es fiable y hay que releer. */
function isStaleDataError(error: unknown): boolean {
  return isAppError(error) && (error.code === 'ENTRY_CONFLICT' || error.code === 'ENTRY_NOT_FOUND')
}

export type SaveEntryVariables =
  | { kind: 'create'; input: CreateJournalEntryInput }
  | { kind: 'update'; input: UpdateJournalEntryInput }

/**
 * Crea o edita una entrada. El éxito llega solo cuando el backend devuelve la
 * fila guardada y se ha vuelto a leer el resto de vistas del usuario.
 */
export function useSaveEntry() {
  const { id: userId } = useCurrentUser()
  const repository = useJournalRepository()
  const queryClient = useQueryClient()

  return useMutation<JournalEntry, Error, SaveEntryVariables>({
    mutationFn: (variables) =>
      variables.kind === 'create' ? repository.create(variables.input) : repository.update(variables.input),
    onSuccess: async (entry) => {
      queryClient.setQueryData(entryKeys.day(userId, entry.date), entry)
      await queryClient.invalidateQueries({ queryKey: entryKeys.all(userId) })
    },
    onError: async (error, variables) => {
      if (isStaleDataError(error)) {
        await queryClient.invalidateQueries({ queryKey: entryKeys.day(userId, variables.input.date) })
      }
    },
  })
}

export function useDeleteEntry() {
  const { id: userId } = useCurrentUser()
  const repository = useJournalRepository()
  const queryClient = useQueryClient()

  return useMutation<void, Error, LocalDate>({
    mutationFn: (date) => repository.deleteByDate(date),
    onSuccess: async (_result, date) => {
      queryClient.setQueryData(entryKeys.day(userId, date), null)
      await queryClient.invalidateQueries({ queryKey: entryKeys.all(userId) })
    },
    onError: async (error) => {
      if (isStaleDataError(error)) await queryClient.invalidateQueries({ queryKey: entryKeys.all(userId) })
    },
  })
}
