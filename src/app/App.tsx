import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { BrowserRouter } from 'react-router'
import { readSupabaseEnv } from '@/lib/supabase/env.ts'
import { ToastProvider } from '@/shared/ui/ToastProvider.tsx'
import { PwaStatus } from '@/features/pwa/PwaStatus.tsx'
import { ConfigErrorPage } from '@/pages/ConfigErrorPage.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import { AuthProvider } from './providers/AuthProvider.tsx'
import { createQueryClient } from './queryClient.ts'
import { AppRoutes } from './router.tsx'

const supabaseConfigured = readSupabaseEnv().ok

export function App() {
  const [queryClient] = useState(createQueryClient)

  if (!supabaseConfigured) return <ConfigErrorPage />

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <PwaStatus />
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
