'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { createAuthClient } from '@/lib/supabase/client'
import LogoPair from '@/components/LogoPair'

export default function LoginPageClient() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
        display: 'flex',
        height: '100dvh',
        position: 'relative',
        alignItems: { xs: 'center', md: 'stretch' },
        justifyContent: { xs: 'center', md: 'flex-start' },
      }}
    >
      {/* 背景画像（モバイル：全画面絶対配置、デスクトップ：左パネル） */}
      <Box
        sx={{
          position: { xs: 'absolute', md: 'relative' },
          inset: { xs: 0, md: 'auto' },
          flex: { md: 1 },
          overflow: 'hidden',
        }}
      >
        <Image
          src="/images.webp"
          alt="イベント画像"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        {/* グラデーションオーバーレイ */}
        <Box
          sx={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(26,46,74,0.6) 0%, rgba(26,46,74,0.2) 100%)',
          }}
        />
        {/* デスクトップ時のみ画像上テキストを表示 */}
        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', bottom: 48, left: 48 }}>
          <Typography
            sx={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.1em', mb: 1 }}
          >
            いばらき × 立命館DAY 2026
          </Typography>
          <Typography
            sx={{ fontSize: '48px', fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.5px' }}
          >
            順番待ち
            <br />
            システム
          </Typography>
          <Typography
            sx={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', mt: 1.5 }}
          >
            リアルタイム整理券発券システム
          </Typography>
        </Box>
      </Box>

      {/* ログインフォーム */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#fff',
          // モバイル：ポップアップカード風
          width: { xs: 'calc(100% - 40px)', md: '440px' },
          maxWidth: { xs: 400, md: 'none' },
          borderRadius: { xs: 3, md: 0 },
          boxShadow: { xs: '0 8px 48px rgba(0,0,0,0.3)', md: '-4px 0 24px rgba(0,0,0,0.08)' },
          px: { xs: 3, md: 5 },
          py: { xs: 4, md: 4 },
        }}
      >
        <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', maxWidth: 360 }}>
          {/* ロゴ */}
          <Box sx={{ mb: 4 }}>
            <LogoPair height={80} />
          </Box>

          {/* タイトル */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{ fontSize: '24px', fontWeight: 800, color: '#1a2e4a', letterSpacing: '-0.3px', mb: 0.5 }}
            >
              管理者ログイン
            </Typography>
            <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
              スタッフ専用ページです
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
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            sx={{ mb: 3 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示する'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* ログインボタン */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !email || !password}
            sx={{
              bgcolor: '#990100',
              py: 1.6,
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: 1.5,
              boxShadow: 'none',
              letterSpacing: '0.04em',
              '&:hover': { bgcolor: '#7c0000', boxShadow: 'none' },
              '&.Mui-disabled': { bgcolor: '#e0e0e0', color: 'rgba(0,0,0,0.35)' },
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
    </Box>
  )
}
