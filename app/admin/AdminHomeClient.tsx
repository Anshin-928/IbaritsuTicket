// app/admin/AdminHomeClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Box, AppBar, Toolbar, IconButton, Typography, Drawer,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, CircularProgress,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import TvOutlinedIcon from '@mui/icons-material/TvOutlined'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined'
import Collapse from '@mui/material/Collapse'
import { createBooth } from './actions'
import type { Booth } from '@/types/database'
import UserAvatarButton from '@/components/UserAvatarButton'

const DRAWER_WIDTH    = 300
const SIDEBAR_BG         = '#990100'
const SIDEBAR_HEADER_BG  = '#c00000'  // ヘッダーは少し明るめ
const SIDEBAR_TEXT       = 'rgba(255, 255, 255)'
const SIDEBAR_TEXT_MUTED = 'rgba(255, 255, 255)'
const SIDEBAR_ACTIVE_BG  = '#b80000'  // 選択中アイテムはヘッダーと同系色
const SIDEBAR_HOVER_BG   = 'rgba(255, 255, 255, 0.15)'

interface Props {
  booths: Booth[]
  fetchError?: string
  children?: React.ReactNode
  pageTitle?: string
  showBackButton?: boolean
}

export default function AdminHomeClient({ booths, fetchError, children, pageTitle, showBackButton }: Props) {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  // 初期値は必ず false（iOS Safari でアニメーション状態が壊れるのを防ぐ）
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [expandedBoothIds, setExpandedBoothIds] = useState<Set<string>>(new Set())
  const [activeBoothId, setActiveBoothId] = useState<string | null>(null)

  // デスクトップでのみ初期オープン
  useEffect(() => {
    if (!isMobile) setSidebarOpen(true)
  }, [isMobile])

  const toggleExpanded = (id: string) => {
    setExpandedBoothIds((prev) => {
      const next = new Set(prev)
      const closing = next.has(id)
      closing ? next.delete(id) : next.add(id)
      setActiveBoothId(closing ? null : id)
      return next
    })
  }

  const clearActive = () => setActiveBoothId(null)
  const pathname = usePathname()
  const router   = useRouter()

  // ── 新規ブース作成ダイアログ ─────────────────────────
  const [dialogOpen, setDialogOpen]   = useState(false)
  const [boothName, setBoothName]     = useState('')
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleOpenDialog = () => {
    setBoothName('')
    setCreateError(null)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    if (creating) return
    setDialogOpen(false)
  }

  const handleCreate = async () => {
    const trimmed = boothName.trim()
    if (!trimmed) {
      setCreateError('ブース名を入力してください。')
      return
    }
    setCreating(true)
    setCreateError(null)

    try {
      const { id } = await createBooth(trimmed)
      setDialogOpen(false)
      router.push(`/admin/${id}`)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : '作成に失敗しました。')
    } finally {
      setCreating(false)
    }
  }

  const drawerWidth = isMobile ? 0 : (isSidebarOpen ? DRAWER_WIDTH : 0)

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#ffffff' }} onClick={clearActive}>

      {/* ── AppBar ──────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          transition: 'width 0.2s, margin 0.2s',
          backgroundColor: '#F0EEEB',
          color: '#1a1a1a',
          borderBottom: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        <Toolbar disableGutters sx={{ minHeight: '60px !important' }}>
          {!isSidebarOpen && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5 }}>
                <IconButton onClick={() => setSidebarOpen(true)} size="small" sx={{ color: '#555' }}>
                  <MenuRoundedIcon />
                </IconButton>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(0,0,0,0.12)' }} />
            </>
          )}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', px: { xs: 1, md: 2.5 } }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
              {showBackButton ? (
                <IconButton onClick={() => router.back()} size="small" sx={{ color: '#555', mr: 0.5, flexShrink: 0 }}>
                  <ArrowBackIcon />
                </IconButton>
              ) : (
                <HomeOutlinedIcon sx={{ fontSize: { xs: '32px', md: '32px' }, color: '#1a1a1a', flexShrink: 0 }} />
              )}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: { xs: '17px', md: '22px' }, color: '#1a1a1a', letterSpacing: '-0.2px' }}>
                {pageTitle ?? 'ホーム'}
              </Typography>
            </Box>
            <UserAvatarButton />
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? isSidebarOpen : undefined}
        onClose={isMobile ? () => setSidebarOpen(false) : undefined}
        anchor="left"
        sx={isMobile ? {
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            overflowX: 'hidden',
            overflowY: 'hidden',
            backgroundColor: SIDEBAR_BG,
            borderRight: 'none',
            color: SIDEBAR_TEXT,
            display: 'flex',
            flexDirection: 'column',
          },
        } : {
          width: isSidebarOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          whiteSpace: 'normal',
          boxSizing: 'border-box',
          transition: 'width 0.2s',
          overflow: 'hidden',
          '& .MuiDrawer-paper': {
            width: isSidebarOpen ? DRAWER_WIDTH : 0,
            transition: 'width 0.2s',
            overflowX: 'hidden',
            overflowY: 'hidden',
            backgroundColor: SIDEBAR_BG,
            borderRight: 'none',
            color: SIDEBAR_TEXT,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* ヘッダー */}
        <Box sx={{ backgroundColor: SIDEBAR_HEADER_BG, px: 3, pt: 2, pb: 2.5, flexShrink: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setSidebarOpen(false)}
            size="small"
            sx={{
              position: 'absolute', top: 14, right: 14,
              color: SIDEBAR_TEXT_MUTED,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', color: SIDEBAR_TEXT },
            }}
          >
            <MenuRoundedIcon sx={{ fontSize: '24px' }} />
          </IconButton>
          <Typography
            variant="caption"
            sx={{ color: SIDEBAR_TEXT_MUTED, fontSize: '16px', fontWeight: 600, display: 'block', mb: 1.5, pr: 4 }}
          >
            いばらき ✕ 立命館DAY 2026
          </Typography>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: SIDEBAR_TEXT, fontSize: '24px', lineHeight: 1.2, letterSpacing: '-0.2px' }}
          >
            管理画面
          </Typography>
        </Box>

        {/* メニューリスト */}
        <List
          sx={{
            px: 0, pt: 1.5, pb: 1, flexGrow: 1, overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'transparent transparent',
            '&:hover': { scrollbarColor: 'rgba(255,255,255,0.2) transparent' },
          }}
        >
          {/* ホーム */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => { clearActive(); router.push('/admin') }}
              selected={pathname === '/admin'}
              sx={{
                minHeight: 44, ml: 0, mr: 2, px: 0,
                borderRadius: '0 22px 22px 0',
                '&:hover': { backgroundColor: pathname === '/admin' ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG },
                '&.Mui-selected': {
                  backgroundColor: SIDEBAR_ACTIVE_BG,
                  '&:hover': { backgroundColor: SIDEBAR_ACTIVE_BG },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, ml: '20px', mr: '10px', justifyContent: 'center', color: pathname === '/admin' ? '#fff' : SIDEBAR_TEXT_MUTED }}>
                <HomeOutlinedIcon sx={{ fontSize: '24px' }} />
              </ListItemIcon>
              <ListItemText
                primary="ホーム"
                sx={{ '& .MuiTypography-root': { fontSize: '15px', fontWeight: pathname === '/admin' ? 700 : 600, color: pathname === '/admin' ? '#fff' : SIDEBAR_TEXT } }}
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} />

          {/* 新規ブースの作成 */}
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => { clearActive(); handleOpenDialog() }}
              sx={{
                minHeight: 44, ml: 0, mr: 2, px: 0,
                borderRadius: '0 22px 22px 0',
                '&:hover': { backgroundColor: SIDEBAR_HOVER_BG },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, ml: '20px', mr: '10px', justifyContent: 'center', color: SIDEBAR_TEXT_MUTED }}>
                <AddBoxOutlinedIcon sx={{ fontSize: '24px' }} />
              </ListItemIcon>
              <ListItemText
                primary="新規ブースの作成"
                sx={{ '& .MuiTypography-root': { fontSize: '16px', fontWeight: 600, color: SIDEBAR_TEXT } }}
              />
            </ListItemButton>
          </ListItem>

          {booths.map((booth) => {
            const path = `/admin/${booth.id}`
            const isSelected = pathname.startsWith(path)
            const isExpanded = expandedBoothIds.has(booth.id)
            const isActive   = activeBoothId === booth.id

            return (
              <ListItem key={booth.id} disablePadding sx={{ display: 'block' }}>
                {/* ブース名行 */}
                <ListItemButton
                  onClick={(e) => { e.stopPropagation(); toggleExpanded(booth.id) }}
                  selected={isSelected}
                  sx={{
                    minHeight: 44, ml: 0, mr: 2, px: 0,
                    borderRadius: '0 22px 22px 0',
                    backgroundColor: isActive && !isSelected ? SIDEBAR_HOVER_BG : undefined,
                    '&:hover': { backgroundColor: isSelected ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG },
                    '&.Mui-selected': {
                      backgroundColor: SIDEBAR_ACTIVE_BG,
                      '&:hover': { backgroundColor: SIDEBAR_ACTIVE_BG },
                    },
                  }}
                >
                  <ListItemText
                    primary={booth.name}
                    sx={{ ml: '58px', '& .MuiTypography-root': { fontSize: '16px', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#fff' : SIDEBAR_TEXT, whiteSpace: 'normal', overflowWrap: 'break-word' } }}
                  />
                  <ChevronRightIcon
                    sx={{
                      mr: '10px',
                      fontSize: '20px',
                      color: SIDEBAR_TEXT_MUTED,
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  />
                </ListItemButton>

                {/* 展開メニュー */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <ListItemButton
                    onClick={() => router.push(path)}
                    sx={{
                      minHeight: 40, ml: 0, mr: 2, px: 0,
                      borderRadius: '0 22px 22px 0',
                      '&:hover': { backgroundColor: SIDEBAR_HOVER_BG },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, ml: '72px', mr: '10px', justifyContent: 'center', color: '#fff' }}>
                      <DashboardOutlinedIcon sx={{ fontSize: '20px' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="管理画面へ"
                      sx={{ '& .MuiTypography-root': { fontSize: '16px', fontWeight: 600, color: '#fff' } }}
                    />
                  </ListItemButton>
                  <ListItemButton
                    onClick={() => router.push(`/admin/${booth.id}/monitor`)}
                    sx={{
                      minHeight: 40, ml: 0, mr: 2, px: 0,
                      borderRadius: '0 22px 22px 0',
                      '&:hover': { backgroundColor: SIDEBAR_HOVER_BG },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, ml: '72px', mr: '10px', justifyContent: 'center', color: '#fff' }}>
                      <TvOutlinedIcon sx={{ fontSize: '20px' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="呼び出し画面"
                      sx={{ '& .MuiTypography-root': { fontSize: '16px', fontWeight: 600, color: '#fff' } }}
                    />
                  </ListItemButton>
                  <ListItemButton
                    onClick={() => router.push(`/admin/${booth.id}/tickets`)}
                    sx={{
                      minHeight: 40, ml: 0, mr: 2, px: 0,
                      borderRadius: '0 22px 22px 0',
                      '&:hover': { backgroundColor: SIDEBAR_HOVER_BG },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, ml: '72px', mr: '10px', justifyContent: 'center', color: '#fff' }}>
                      <ConfirmationNumberOutlinedIcon sx={{ fontSize: '20px' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="整理券PDF生成"
                      sx={{ '& .MuiTypography-root': { fontSize: '16px', fontWeight: 600, color: '#fff' } }}
                    />
                  </ListItemButton>
                </Collapse>
              </ListItem>
            )
          })}
        </List>

      </Drawer>

      {/* ── メインコンテンツ ─────────────────────────────── */}
      <Box
        component="main"
        sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}
      >
        <Toolbar sx={{ minHeight: '60px !important', flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, md: 4 } }}>
          {children ?? (
            <>
              {fetchError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  データの取得に失敗しました: {fetchError}
                </Alert>
              )}
              {booths.length === 0 && !fetchError && (
                <Alert severity="info">ブースが登録されていません。</Alert>
              )}
              {booths.length > 0 && (
                <Typography variant="body1" color="text.secondary">
                  左のサイドバーからブースを選択してください。
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* ── 新規ブース作成ダイアログ ───────────────────────── */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>新規ブースの作成</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="ブース名"
            value={boothName}
            onChange={(e) => setBoothName(e.target.value)}

            disabled={creating}
            error={!!createError}
            helperText={createError ?? ''}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={creating}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !boothName.trim()}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            作成
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}
