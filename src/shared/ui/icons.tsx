import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 20, ...props }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
    focusable: false,
    ...props,
  }
}

export function SproutIcon({ size = 26, ...props }: IconProps) {
  return (
    <svg {...base({ size, ...props })} viewBox="0 0 32 32">
      <path d="M16 29 C16 20 16 14 16 9" stroke="#354E41" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 15 C12 13 9 14 8 18 C12 19 15 17 16 15Z" fill="#8BAA91" />
      <path d="M16 11 C20 9 23 10 24 14 C20 15 17 13 16 11Z" fill="#8BAA91" />
      <circle cx="16" cy="8" r="4" fill="#F5D36A" />
    </svg>
  )
}

export function TodayIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="5" fill="currentColor" />
    </svg>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20v-2a7 7 0 0 1 14 0v2" />
    </svg>
  )
}

export function SignOutIcon(props: IconProps) {
  return (
    <svg {...base(props)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M10 12h10m-4-4 4 4-4 4" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base(props)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <circle cx="14" cy="7" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="13" x2="20" y2="13" />
      <circle cx="9" cy="13" r="2" fill="currentColor" stroke="none" />
      <line x1="4" y1="19" x2="20" y2="19" />
      <circle cx="16" cy="19" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, ...props })} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, ...props })} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base({ size: 14, ...props })} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base({ size: 12, ...props })} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base({ size: 14, ...props })} stroke="currentColor" strokeWidth="1.6">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base({ size: 28, ...props })} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  )
}
