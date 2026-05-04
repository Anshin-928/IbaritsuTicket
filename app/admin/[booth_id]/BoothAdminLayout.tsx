// app/admin/[booth_id]/BoothAdminLayout.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Box, AppBar, Toolbar, IconButton, Typography, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import Sidebar, { openDrawerWidth } from '@/components/Sidebar'
import { allMenuItems, getBoothPath } from '@/config/adminMenu'
import { MonitorBadgeProvider, useMonitorBadge } from '@/context/monitorBadge'

interface BoothAdminLayoutProps {
  children: React.ReactNode
  boothId: string
  boothName: string
}

function BoothAdminLayoutInner({ children, boothId, boothName }: BoothAdminLayoutProps) {
  const pathname = usePathname()
  const isMonitor = pathname === `/admin/${boothId}/monitor`
  const [isSidebarOpen, setSidebarOpen] = useState(!isMonitor)
  const { waitingCount } = useMonitorBadge()
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // モバイルではサイドバーを閉じた状態にする
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  const currentItem = allMenuItems.find((item) => {
    const path = getBoothPath(boothId, item.pathSegment)
    return pathname === path
  })

  // モバイルではtemporaryドロワー（オーバーレイ）なのでAppBarはフル幅
  const drawerWidth = isMobile ? 0 : (isSidebarOpen ? openDrawerWidth : 0)

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#ffffff' }}>

      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          transition: 'width 0.2s, margin 0.2s',
          backgroundColor: isMonitor ? '#274a79' : '#F0EEEB',
          color: isMonitor ? '#fff' : '#1a1a1a',
          borderBottom: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}
      >
        <Toolbar disableGutters sx={{ minHeight: '60px !important' }}>

          {/* ハンバーガー（サイドバーが閉じているときのみ表示） */}
          {!isSidebarOpen && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5 }}>
                <IconButton
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  size="small"
                  sx={{ color: isMonitor ? '#fff' : '#555' }}
                >
                  <MenuRoundedIcon />
                </IconButton>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ borderColor: isMonitor ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)' }} />
            </>
          )}

          {isMonitor ? (
            /* 呼び出し画面専用 */
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 2.5 }}>
              {/* 左端：ブース名 */}
              <Typography sx={{ fontSize: '26px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                {boothName}
              </Typography>
              {/* 右端：待ち組数バッジ ＋ イベント名 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  bgcolor: '#fff', borderRadius: '50px',
                  px: '18px', py: '6px',
                }}>
                  <Typography sx={{ fontSize: { xs: '22px', md: '28px' }, fontWeight: 700, color: '#274a79', lineHeight: 1 }}>
                    {waitingCount}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '13px', md: '16px' }, fontWeight: 'bold', color: '#274a79', opacity: 0.75, mt: '2px' }}>
                    組待ち
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '18px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em', display: { xs: 'none', md: 'block' } }}>
                  いばらき × 立命館DAY 2026
                </Typography>
              </Box>
            </Box>
          ) : (
            /* 通常ページ */
            <Box display="flex" alignItems="center" gap={1} sx={{ px: 2.5 }}>
              {currentItem && (
                <>
                  <currentItem.Icon sx={{ fontSize: '32px', color: '#1E3A5F' }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '22px', color: '#1a1a1a', letterSpacing: '-0.2px' }}>
                    {currentItem.text}
                  </Typography>
                </>
              )}
            </Box>
          )}

        </Toolbar>
      </AppBar>

      {/* サイドバー */}
      <Sidebar isSidebarOpen={isSidebarOpen} boothId={boothId} boothName={boothName} onToggle={() => setSidebarOpen((p) => !p)} />

      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* AppBar の高さ分のスペーサー */}
        <Toolbar sx={{ minHeight: '60px !important', flexShrink: 0 }} />

        {/* コンテンツ */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            ...(isMonitor ? {} : { overflowY: 'auto', p: { xs: 2, md: 4 } }),
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default function BoothAdminLayout(props: BoothAdminLayoutProps) {
  return (
    <MonitorBadgeProvider>
      <BoothAdminLayoutInner {...props} />
    </MonitorBadgeProvider>
  )
}
