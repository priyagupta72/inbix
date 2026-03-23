'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366F1',
    },
    secondary: {
      main: '#10B981',
    },
  },
})

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
        <Toaster position="top-right" />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}