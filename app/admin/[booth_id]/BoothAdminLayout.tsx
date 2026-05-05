// app/admin/[booth_id]/BoothAdminLayout.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Box, AppBar, Toolbar, IconButton, Typography, Divider } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import Sidebar from '@/components/Sidebar'
import UserAvatarButton from '@/components/UserAvatarButton'
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
  // 初期値は必ず false（SSR とモバイル両方で closed スタートにする）
  // → temporary Drawer が open=true → false と瞬時遷移することで
  //   iOS Safari のアニメーション状態が壊れるのを防ぐ
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const { waitingCount } = useMonitorBadge()
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // デスクトップ（非モバイル・非モニター）でのみ初期オープン
  useEffect(() => {
    setSidebarOpen(!isMobile && !isMonitor)
  }, [isMobile, isMonitor])

  const currentItem = allMenuItems.find((item) => {
    const path = getBoothPath(boothId, item.pathSegment)
    return pathname === path
  })

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#ffffff' }}>

      {/* サイドバー */}
      <Sidebar isSidebarOpen={isSidebarOpen} boothId={boothId} boothName={boothName} onToggle={() => setSidebarOpen((p) => !p)} isTemporary={isMobile} />

      {/* メインコンテンツ（AppBar + コンテンツ の flex column） */}
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
        {/* AppBar を static にしてフロー内に配置 → 高さが伸びてもコンテンツが隠れない */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            backgroundColor: isMonitor ? '#274a79' : '#F0EEEB',
            color: isMonitor ? '#fff' : '#1a1a1a',
            borderBottom: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            flexShrink: 0,
          }}
        >
        <Toolbar disableGutters sx={{ minHeight: 60, flexWrap: 'wrap', py: 0.5 }}>

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
            <Box sx={{
              flex: 1, minWidth: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap',
              px: { xs: 1.5, md: 2.5 },
              gap: { xs: '6px', md: '16px' },
              py: 0.5,
            }}>
              {/* 左端：ブース名（長ければ折り返して全表示） */}
              <Typography sx={{
                fontSize: { xs: '19px', md: '26px' },
                fontWeight: 700, color: '#fff', letterSpacing: '-0.3px',
                lineHeight: 1.3,
              }}>
                {boothName}
              </Typography>
              {/* 右端：待ち組数バッジ（内部は折り返し禁止） */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: '8px', md: '16px' }, flexShrink: 0 }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: { xs: '4px', md: '6px' },
                  bgcolor: '#fff', borderRadius: '50px',
                  px: { xs: '12px', md: '18px' }, py: { xs: '5px', md: '6px' },
                  whiteSpace: 'nowrap',
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
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', px: { xs: 1.5, md: 2.5 }, py: 0.5 }}>
              <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
                {pathname === `/admin/${boothId}/account` ? (
                  <>
                    <AccountCircleOutlinedIcon sx={{ fontSize: { xs: '24px', md: '32px' }, color: '#1E3A5F', flexShrink: 0 }} />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{
                      fontSize: { xs: '19px', md: '22px' }, color: '#1a1a1a', letterSpacing: '-0.2px',
                      lineHeight: 1.3,
                    }}>
                      マイアカウント
                    </Typography>
                  </>
                ) : currentItem && (
                  <>
                    <currentItem.Icon sx={{ fontSize: { xs: '24px', md: '32px' }, color: '#1E3A5F', flexShrink: 0 }} />
                    <Typography variant="subtitle1" fontWeight="bold" sx={{
                      fontSize: { xs: '19px', md: '22px' }, color: '#1a1a1a', letterSpacing: '-0.2px',
                      lineHeight: 1.3,
                    }}>
                      {currentItem.text}
                    </Typography>
                  </>
                )}
              </Box>
              <UserAvatarButton accountPath={`/admin/${boothId}/account`} />
            </Box>
          )}

        </Toolbar>
      </AppBar>

      {/* コンテンツ（AppBar の下に自然に続く） */}
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
