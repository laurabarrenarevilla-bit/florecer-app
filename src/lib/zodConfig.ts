import { z } from 'zod'

// Sin compilación dinámica (new Function): compatible con la CSP estricta de
// vercel.json (script-src 'self', sin 'unsafe-eval'). Ver ADR-009.
z.config({ jitless: true })
