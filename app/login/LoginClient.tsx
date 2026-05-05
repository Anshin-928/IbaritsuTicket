'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { createAuthClient } from '@/lib/supabase/client'

export default function LoginClient() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createAuthClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません。')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1a2e4a',
        p: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{
          width: '100%',
          maxWidth: 420,
          bgcolor: '#fff',
          borderRadius: 3,
          p: { xs: 3, md: 4.5 },
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* ロゴ・タイトル */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box
            sx={{
              width: 52, height: 52,
              borderRadius: '50%',
              bgcolor: '#274a79',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Typography
            sx={{ fontSize: '13px', fontWeight: 600, color: '#888', letterSpacing: '0.08em', mb: 0.5 }}
          >
            いばらき × 立命館DAY 2026
          </Typography>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ fontSize: '22px', color: '#1a1a1a', letterSpacing: '-0.3px' }}
          >
            管理者ログイン
          </Typography>
        </Box>

        {/* エラー */}
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, fontSize: '0.875rem' }}>
            {error}
          </Alert>
        )}

        {/* メールアドレス */}
        <TextField
          label="メールアドレス"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
          sx={{ mb: 2 }}
        />

        {/* パスワード */}
        <TextField
          label="パスワード"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          autoComplete="current-password"
          sx={{ mb: 3 }}
        />

        {/* ログインボタン */}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading || !email || !password}
          sx={{
            bgcolor: '#274a79',
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: 1.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#1a3560', boxShadow: 'none' },
            '&.Mui-disabled': { bgcolor: '#ddd', color: 'rgba(0,0,0,0.35)' },
          }}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} sx={{ color: '#fff' }} />
              <span>ログイン中...</span>
            </Box>
          ) : (
            'ログイン'
          )}
        </Button>
      </Box>
    </Box>
  )
}
