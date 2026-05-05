// app/components/ThemeRegistry.tsx
'use client'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4285F4',
    },
    background: {
      default: '#F0F4F9', // サイドバー・ページ背景
      paper:   '#FFFFFF', // カード・メインコンテンツ背景
    },
    text: {
      primary:   '#1a1a1a',
      secondary: '#444444',
      disabled:  '#888888',
    },
    divider: '#E8E8E8',
    success: { main: '#34A853' },
    warning: { main: '#FBBC04' },
    error:   { main: '#EA4335' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: '#444444',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          '*': {
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
            transition: 'scrollbar-color 0.3s',
          },
          '*:hover': {
            scrollbarColor: 'rgba(0,0,0,0.18) transparent',
          },
          '*::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            background: 'transparent',
            borderRadius: '99px',
            transition: 'background 0.3s',
          },
          '*:hover::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.18)',
          },
        }} />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
