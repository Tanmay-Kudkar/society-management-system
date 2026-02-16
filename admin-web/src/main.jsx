import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { AuthProvider, SettingsProvider } from './context'
import App from './App.jsx'
import './styles/main.css'

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Only fire for mutations that don't have their own onError
      if (!mutation.options.onError) {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong'
        window.dispatchEvent(
          new CustomEvent('global-mutation-error', { detail: msg })
        )
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401/403 (auth errors)
        const status = error?.response?.status
        if (status === 401 || status === 403) return false
        // Keep retrying indefinitely for network/server errors (backend sleeping)
        return true
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>,
)
