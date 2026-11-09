import { BrowserRouter } from 'react-router'
import { ToastProvider } from '@/shared/ui/ToastProvider.tsx'
import { AppRoutes } from './router.tsx'

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}
