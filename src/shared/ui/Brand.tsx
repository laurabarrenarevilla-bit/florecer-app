import { SproutIcon } from './icons.tsx'

interface BrandProps {
  size?: 'md' | 'lg'
  /** Nivel de encabezado si la marca actúa como título de la página. */
  as?: 'span' | 'h1'
}

export function Brand({ size = 'md', as: Tag = 'span' }: BrandProps) {
  return (
    <span className={size === 'lg' ? 'brand brand--lg' : 'brand'}>
      <SproutIcon size={size === 'lg' ? 36 : 24} />
      <Tag className="brand__name">Florecer</Tag>
    </span>
  )
}
