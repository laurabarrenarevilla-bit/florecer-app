import { useId, useRef, useState, type ChangeEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/authContext.ts'
import { PartialImportError } from '@/features/journal/journalRepository.ts'
import { entryKeys, useImportEntries } from '@/features/journal/queries.ts'
import { useJournalRepository } from '@/features/journal/repositoryContext.ts'
import { formatLongDate } from '@/shared/lib/dates.ts'
import { ERROR_MESSAGES, isAppError } from '@/shared/lib/errors.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { InlineAlert } from '@/shared/ui/InlineAlert.tsx'
import { backupFileName, buildBackup, parseBackupText, previewImport, type ImportPreview } from './backupFormat.ts'

type ExportState = { status: 'idle' | 'working' } | { status: 'done'; count: number } | { status: 'error'; message: string }

type ImportState =
  | { status: 'idle' }
  | { status: 'reading' }
  | { status: 'rejected'; message: string }
  | { status: 'preview'; fileName: string; preview: ImportPreview }
  | { status: 'done'; inserted: number; skipped: number; total: number }
  | { status: 'partial'; inserted: number; message: string }

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

function errorText(error: unknown): string {
  return isAppError(error) ? error.message : ERROR_MESSAGES.UNKNOWN
}

/**
 * Copias de seguridad (docs/12): exportar todas las entradas a un JSON que se
 * descarga en el dispositivo, e importar uno con vista previa. La importación
 * nunca sobrescribe: omite las fechas que ya existen en la cuenta.
 */
export function BackupSection() {
  const { id: userId } = useCurrentUser()
  const repository = useJournalRepository()
  const queryClient = useQueryClient()
  const importMutation = useImportEntries()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle' })
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' })

  // Siempre se leen todas las entradas en el momento: una copia no puede salir de una caché antigua.
  const loadAll = () => queryClient.fetchQuery({ queryKey: entryKeys.everything(userId), queryFn: () => repository.listAll(), staleTime: 0 })

  const exportBackup = async () => {
    setExportState({ status: 'working' })
    try {
      const entries = await loadAll()
      const blob = new Blob([JSON.stringify(buildBackup(entries), null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = backupFileName()
      document.body.append(link)
      link.click()
      link.remove()
      // Se libera después: algunos navegadores leen la URL tras el clic.
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportState({ status: 'done', count: entries.length })
    } catch (error) {
      setExportState({ status: 'error', message: `No hemos podido preparar la copia. ${errorText(error)}` })
    }
  }

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // permite volver a elegir el mismo archivo
    if (!file) return
    setImportState({ status: 'reading' })
    try {
      const parsed = parseBackupText(await file.text(), file.size)
      if (!parsed.ok) {
        setImportState({ status: 'rejected', message: parsed.message })
        return
      }
      const existing = new Set((await loadAll()).map((entry) => entry.date))
      setImportState({ status: 'preview', fileName: file.name, preview: previewImport(parsed.entries, existing) })
    } catch (error) {
      setImportState({ status: 'rejected', message: `No hemos podido leer el archivo o tus registros. ${errorText(error)}` })
    }
  }

  const confirmImport = async (preview: ImportPreview) => {
    try {
      const { inserted } = await importMutation.mutateAsync(preview.toImport)
      setImportState({
        status: 'done',
        inserted: inserted.length,
        // Puede haber más omitidas que en la vista previa si otra pestaña creó días entre medias.
        skipped: preview.existing.length + (preview.toImport.length - inserted.length),
        total: preview.toImport.length + preview.existing.length,
      })
    } catch (error) {
      const inserted = error instanceof PartialImportError ? error.inserted.length : 0
      setImportState({ status: 'partial', inserted, message: errorText(error) })
    }
  }

  return (
    <section className="card settings__section backup" aria-labelledby="settings-backup">
      <h2 className="settings__heading" id="settings-backup">
        Copia de seguridad
      </h2>

      <div className="backup__block">
        <h3 className="backup__title">Descargar tus registros</h3>
        <p>
          Descarga un archivo con todas tus entradas para guardarlo donde quieras. <strong>El archivo no está cifrado</strong>:
          cualquiera que lo abra podrá leer tu diario, así que guárdalo en un lugar seguro.
        </p>
        <Button variant="secondary" onClick={() => void exportBackup()} isLoading={exportState.status === 'working'} loadingText="Preparando la copia…">
          Descargar copia
        </Button>
        <div aria-live="polite">
          {exportState.status === 'done' && (
            <InlineAlert tone="success">
              Copia descargada con {plural(exportState.count, 'entrada', 'entradas')}.
            </InlineAlert>
          )}
          {exportState.status === 'error' && <InlineAlert tone="error">{exportState.message}</InlineAlert>}
        </div>
      </div>

      <div className="backup__block">
        <h3 className="backup__title">Importar una copia</h3>
        <p>
          Recupera entradas desde un archivo descargado de Florecer. El archivo se lee en tu dispositivo. Los días que ya tengas
          registrados no se modifican: se omiten.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          className="visually-hidden"
          type="file"
          accept=".json,application/json"
          aria-label="Archivo de copia de Florecer"
          tabIndex={-1}
          onChange={(event) => void chooseFile(event)}
        />
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          isLoading={importState.status === 'reading'}
          loadingText="Leyendo el archivo…"
          disabled={importMutation.isPending}
        >
          Elegir archivo…
        </Button>

        <div aria-live="polite">
          {importState.status === 'rejected' && <InlineAlert tone="error">{importState.message}</InlineAlert>}

          {importState.status === 'preview' && (
            <ImportPreviewPanel
              fileName={importState.fileName}
              preview={importState.preview}
              isImporting={importMutation.isPending}
              onCancel={() => setImportState({ status: 'idle' })}
              onConfirm={() => void confirmImport(importState.preview)}
            />
          )}

          {importState.status === 'done' && (
            <InlineAlert tone="success">
              Importación completada: {plural(importState.inserted, 'entrada añadida', 'entradas añadidas')}
              {importState.skipped > 0 && ` y ${plural(importState.skipped, 'omitida', 'omitidas')} porque ese día ya existía`}.
            </InlineAlert>
          )}

          {importState.status === 'partial' && (
            <InlineAlert tone="error">
              La importación no se ha completado. {importState.message}{' '}
              {importState.inserted > 0
                ? `Se guardaron ${plural(importState.inserted, 'entrada', 'entradas')} antes del error; si vuelves a importar el archivo, se omitirán.`
                : 'No se ha guardado ninguna entrada.'}
            </InlineAlert>
          )}
        </div>
      </div>
    </section>
  )
}

interface ImportPreviewPanelProps {
  fileName: string
  preview: ImportPreview
  isImporting: boolean
  onCancel: () => void
  onConfirm: () => void
}

function ImportPreviewPanel({ fileName, preview, isImporting, onCancel, onConfirm }: ImportPreviewPanelProps) {
  const count = preview.toImport.length
  const sorted = [...preview.toImport].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return (
    <div className="backup__preview" role="region" aria-label="Vista previa de la importación">
      <p className="backup__file">{fileName}</p>
      <ul className="backup__counts">
        <li>
          <strong>{count}</strong> {count === 1 ? 'entrada nueva se añadirá' : 'entradas nuevas se añadirán'}
          {first && last && (
            <span className="backup__range">
              {' '}
              ({first.date === last.date ? formatLongDate(first.date, { withYear: true }) : `del ${formatLongDate(first.date, { withYear: true })} al ${formatLongDate(last.date, { withYear: true })}`})
            </span>
          )}
        </li>
        <li>
          <strong>{preview.existing.length}</strong> {preview.existing.length === 1 ? 'se omitirá' : 'se omitirán'} porque ese día ya
          tiene registro
        </li>
        {preview.duplicatedInFile.length > 0 && (
          <li>
            <strong>{preview.duplicatedInFile.length}</strong> repetidas dentro del archivo (se usa la primera)
          </li>
        )}
        <li>
          <strong>{preview.invalid.length}</strong> {preview.invalid.length === 1 ? 'no es válida' : 'no son válidas'} y no se
          importarán
        </li>
      </ul>
      {preview.invalid.length > 0 && (
        <details className="backup__invalid">
          <summary>Ver entradas no válidas</summary>
          <ul>
            {preview.invalid.slice(0, 50).map((item) => (
              <li key={item.position}>
                Entrada {item.position}
                {item.date ? ` (${item.date})` : ''}: {item.reason}
              </li>
            ))}
          </ul>
          {preview.invalid.length > 50 && <p>Y {preview.invalid.length - 50} más.</p>}
        </details>
      )}
      <div className="btn-row">
        <Button variant="secondary" onClick={onCancel} disabled={isImporting}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} disabled={count === 0} isLoading={isImporting} loadingText="Importando…">
          {count === 0 ? 'Nada que importar' : `Importar ${plural(count, 'entrada', 'entradas')}`}
        </Button>
      </div>
    </div>
  )
}
