'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import { createAuthClient } from '@/lib/supabase/client'

// ── 画像圧縮ユーティリティ ────────────────────────────
// 最長辺が MAX_PX 以下になるよう縮小し WebP に変換する
function compressImage(file: File): Promise<Blob> {
  const MAX_PX  = 400
  const QUALITY = 0.85
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(MAX_PX / img.width, MAX_PX / img.height, 1)
        const w = Math.round(img.width  * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width  = w
        canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('圧縮に失敗しました')),
          'image/webp',
          QUALITY,
        )
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function AccountClient() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [email,     setEmail]     = useState('')
  const [fullName,  setFullName]  = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId,    setUserId]    = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [snackbar,  setSnackbar]  = useState<string | null>(null)

  useEffect(() => {
    const supabase = createAuthClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')
      setFullName(user.user_metadata?.full_name ?? '')
      setAvatarUrl(user.user_metadata?.avatar_url ?? null)
    })
  }, [])

  // ── アバター画像アップロード ──────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploading(true)
    setError(null)
    try {
      const compressed = await compressImage(file)
      const supabase   = createAuthClient()

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/avatar.webp`, compressed, {
          upsert: true,
          contentType: 'image/webp',
        })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/avatar.webp`)

      const newUrl = `${publicUrl}?v=${Date.now()}`
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: newUrl },
      })
      if (updateError) throw updateError

      setAvatarUrl(newUrl)
      setSnackbar('アバター画像を更新しました')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── ログアウト ───────────────────────────────────────
  const handleLogout = async () => {
    const supabase = createAuthClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // ── 表示名の保存 ─────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const supabase = createAuthClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      })
      if (error) throw error
      setSnackbar('プロフィールを保存しました')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto' }}>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* アバターカード */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 3, mb: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <Typography fontWeight="bold" sx={{ fontSize: '1.2rem', mb: 2.5 }}>
          プロフィール画像
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {/* アバタープレビュー */}
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={avatarUrl ?? undefined}
              sx={{ width: 88, height: 88, bgcolor: avatarUrl ? 'transparent' : '#c0392b' }}
            >
              {!avatarUrl && <PersonOutlinedIcon sx={{ fontSize: 44 }} />}
            </Avatar>
            {uploading && (
              <Box sx={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CircularProgress size={24} sx={{ color: '#fff' }} />
              </Box>
            )}
          </Box>

          {/* アップロードボタン */}
          <Box>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Tooltip title="JPG・PNG・WebP など各種形式に対応。自動で圧縮されます。">
              <Button
                variant="outlined"
                size="small"
                startIcon={<PhotoCameraOutlinedIcon />}
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                sx={{ borderColor: '#ccc', color: '#555', '&:hover': { borderColor: '#999', bgcolor: 'rgba(0,0,0,0.03)' } }}
              >
                画像を変更
              </Button>
            </Tooltip>
            <Typography sx={{ fontSize: '14px', color: 'text.secondary', mt: 0.75 }}>
              自動で 400px・WebP に圧縮されます
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* プロフィールカード */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <Typography fontWeight="bold" sx={{ fontSize: '1.2rem', mb: 2.5 }}>
          アカウント情報
        </Typography>

        <TextField
          label="表示名"
          fullWidth
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="スタッフ名を入力"
          sx={{ mb: 2 }}
        />

        <TextField
          label="メールアドレス"
          fullWidth
          value={email}
          disabled
          helperText="メールアドレスの変更はシステム管理者にお問い合わせください"
          sx={{ mb: 3 }}
        />

        <Divider sx={{ mb: 2.5 }} />

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={saving}
          onClick={handleSave}
          sx={{
            bgcolor: '#990100',
            boxShadow: 'none',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#7c0000', boxShadow: 'none' },
          }}
        >
          {saving ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} sx={{ color: '#fff' }} />
              <span>保存中...</span>
            </Box>
          ) : '変更を保存'}
        </Button>
      </Box>

      {/* ログアウト */}
      <Box sx={{ mt: 2.5 }}>
        <Button
          variant="outlined"
          fullWidth
          size="large"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            color: '#b71c1c',
            borderColor: '#ef9a9a',
            fontWeight: 'bold',
            '&:hover': { bgcolor: '#fff5f5', borderColor: '#b71c1c' },
          }}
        >
          ログアウト
        </Button>
      </Box>

      {/* 成功通知 */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnackbar(null)}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  )
}
