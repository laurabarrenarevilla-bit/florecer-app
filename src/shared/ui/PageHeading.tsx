import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.ts'

interface PageHeadingProps {
  title: string
  eyebrow?: ReactNode
  lead?: ReactNode
  /** Título del documento; por defecto el título de la página. */
  documentTitle?: string
}

export function PageHeading({ title, eyebrow, lead, documentTitle }: PageHeadingProps) {
  useDocumentTitle(documentTitle ?? title)

  return (
    <header className="page-heading">
      {eyebrow && <p className="page-heading__eyebrow">{eyebrow}</p>}
      <h1 className="page-heading__title">{title}</h1>
      {lead && <p className="page-heading__lead">{lead}</p>}
    </header>
  )
}
