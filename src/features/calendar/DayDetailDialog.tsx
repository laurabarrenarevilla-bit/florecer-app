import { useState } from 'react'
import { EntrySummary } from '@/features/journal/EntrySummary.tsx'
import { JournalForm } from '@/features/journal/JournalForm.tsx'
import { useDeleteEntry, useEntryByDate, useSaveEntry } from '@/features/journal/queries.ts'
import type { JournalEntryContent } from '@/features/journal/types.ts'
import { formatLongDate, isFutureDate, type LocalDate } from '@/shared/lib/dates.ts'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { capitalizeFirst } from '@/shared/lib/text.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.tsx'
import { Dialog } from '@/shared/ui/Dialog.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { LoadingState } from '@/shared/ui/LoadingState.tsx'
import { useToast } from '@/shared/ui/toastContext.ts'

interface DayDetailDialogProps {
  /** Día abierto; null cierra el diálogo. */
  date: LocalDate | null
  today: LocalDate
  onClose: () => void
}

/** Detalle de un día: ver, crear (días pasados), editar y eliminar con confirmación. */
export function DayDetailDialog({ date, today, onClose }: DayDetailDialogProps) {
  return (
    <Dialog
      open={date !== null}
      onClose={onClose}
      title={date ? capitalizeFirst(formatLongDate(date, { withYear: true })) : ''}
    >
      {date && <DayDetail key={date} date={date} today={today} onDone={onClose} />}
    </Dialog>
  )
}

function messageOf(error: unknown): string {
  return isAppError(error) ? error.message : ERROR_MESSAGES.UNKNOWN
}

function DayDetail({ date, today, onDone }: { date: LocalDate; today: LocalDate; onDone: () => void }) {
  const isFuture = isFutureDate(date, today)
  // Un día futuro no puede tener registro: ni siquiera se consulta.
  const entryQuery = useEntryByDate(date, { enabled: !isFuture })
  const save = useSaveEntry()
  const remove = useDeleteEntry()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (isFuture) {
    return <p className="dialog__text">Este día todavía no ha llegado. Podrás registrarlo cuando llegue.</p>
  }

  if (entryQuery.isPending) return <LoadingState label="Cargando el registro…" />

  if (entryQuery.isError && entryQuery.data === undefined) {
    return (
      <InlineAlert
        tone="error"
        actions={
          <Button variant="secondary" onClick={() => void entryQuery.refetch()} isLoading={entryQuery.isFetching} loadingText="Reintentando…">
            Reintentar
          </Button>
        }
      >
        No hemos podido cargar este día. {messageOf(entryQuery.error)}
      </InlineAlert>
    )
  }

  const entry = entryQuery.data ?? null

  const handleSubmit = async (content: JournalEntryContent) => {
    try {
      await save.mutateAsync(
        entry
          ? { kind: 'update', input: { ...content, date, expectedUpdatedAt: entry.updatedAt } }
          : { kind: 'create', input: { ...content, date } },
      )
    } catch {
      // El error (y el borrador) se quedan en el formulario.
      return
    }
    setEditing(false)
    showToast(entry ? 'Cambios guardados.' : 'Registro guardado.')
  }

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(date)
    } catch (error) {
      // Si ya no existía (borrado en otra pestaña), se informa y se muestra el día actualizado;
      // cualquier otro error se queda visible dentro de la confirmación.
      if (isAppError(error) && error.code === 'ENTRY_NOT_FOUND') {
        closeConfirm()
        showToast(error.message)
      }
      return
    }
    setConfirmOpen(false)
    showToast('Registro eliminado.')
    onDone()
  }

  const closeConfirm = () => {
    setConfirmOpen(false)
    remove.reset()
  }

  if (editing) {
    return (
      <JournalForm
        initial={entry}
        moodLegend="¿Cómo te sentiste este día?"
        submitLabel={entry ? 'Guardar cambios' : 'Guardar registro'}
        savingLabel="Guardando…"
        isSaving={save.isPending}
        error={save.error}
        onSubmit={handleSubmit}
        onCancel={() => {
          save.reset()
          setEditing(false)
        }}
      />
    )
  }

  if (!entry) {
    return (
      <div className="day-detail__empty">
        <p className="dialog__text">No hay registro de este día.</p>
        <Button block onClick={() => setEditing(true)}>
          Añadir registro de este día
        </Button>
      </div>
    )
  }

  return (
    <>
      <EntrySummary entry={entry} heading="Registro del día" />
      <div className="btn-row">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <Button variant="danger-outline" onClick={() => setConfirmOpen(true)}>
          Eliminar
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="¿Eliminar este registro?"
        message="Se borrará la emoción, la reflexión y el logro de este día. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loadingText="Eliminando…"
        isLoading={remove.isPending}
        error={remove.error ? messageOf(remove.error) : null}
        onConfirm={() => void handleDelete()}
        onCancel={closeConfirm}
      />
    </>
  )
}
