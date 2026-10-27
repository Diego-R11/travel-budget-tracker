import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n'

/** App-wide providers. Tests render the app inside this too, with a fresh client each time. */
export function Providers({ children, client }: { children: ReactNode; client?: QueryClient }) {
  // One retry is enough for a daily-updated endpoint; tests pass a client without retries.
  const [queryClient] = useState(() => client ?? new QueryClient({ defaultOptions: { queries: { retry: 1 } } }))
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
