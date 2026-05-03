// src/components/Sidebar.tsx
'use client'

import React from 'react'
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Typography, Box, IconButton,
} from '@mui/material'
import { usePathname, useRouter } from 'next/navigation'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import { menuGroups, getBoothPath } from '@/config/adminMenu'

export const closedDrawerWidth = 0
export const openDrawerWidth   = 300

// ── カラーパレット ─────────────────────────────────────
const SIDEBAR_BG         = '#274a79'
const SIDEBAR_HEADER_BG  = '#3363a3'
const SIDEBAR_TEXT       = 'rgba(255, 255, 255)'
const SIDEBAR_TEXT_MUTED = 'rgba(255, 255, 255, 0.70)'
const SIDEBAR_ACTIVE_BG  = '#3b72bb'
const SIDEBAR_HOVER_BG   = 'rgba(255, 255, 255, 0.15)'

interface SidebarProps {
  isSidebarOpen: boolean
  boothId: string
  boothName: string
  onToggle: () => void
}

export default function Sidebar({ isSidebarOpen, boothId, boothName, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: isSidebarOpen ? openDrawerWidth : closedDrawerWidth,
        flexShrink: 0,
        whiteSpace: 'normal',
        boxSizing: 'border-box',
        transition: 'width 0.2s',
        overflow: 'hidden',
        '& .MuiDrawer-paper': {
          width: isSidebarOpen ? openDrawerWidth : closedDrawerWidth,
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
      {/* ── ヘッダー（イベント名 ＋ ブース名） ───────── */}
      <Box
        sx={{
          backgroundColor: SIDEBAR_HEADER_BG,
          px: 3,
          pt: 2,
          pb: 2.5,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* 閉じるボタン（右上） */}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            position: 'absolute',
            top: 14,
            right: 14,
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
          sx={{ color: SIDEBAR_TEXT, fontSize: '24px', lineHeight: 1.2, letterSpacing: '-0.2px', overflowWrap: 'break-word' }}
        >
          {boothName}
        </Typography>
      </Box>

      {/* ── メニューリスト ────────────────────────────── */}
      <List
        sx={{
          px: 0,
          pt: 1.5,
          pb: 1,
          flexGrow: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
          '&:hover': {
            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
          },
        }}
      >
        {/* ホーム */}
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => router.push('/admin')}
            selected={pathname === '/admin'}
            sx={{
              minHeight: 44,
              ml: 0,
              mr: 2,
              px: 0,
              borderRadius: '0 22px 22px 0',
              color: pathname === '/admin' ? '#fff' : SIDEBAR_TEXT,
              '&:hover': {
                backgroundColor: pathname === '/admin' ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG,
              },
              '&.Mui-selected': {
                backgroundColor: SIDEBAR_ACTIVE_BG,
                '&:hover': { backgroundColor: SIDEBAR_ACTIVE_BG },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                ml: '20px',
                mr: '14px',
                justifyContent: 'center',
                color: pathname === '/admin' ? '#fff' : SIDEBAR_TEXT_MUTED,
              }}
            >
              <HomeOutlinedIcon sx={{ fontSize: '24px' }} />
            </ListItemIcon>
            <ListItemText
              primary="ホーム"
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '15px',
                  fontWeight: pathname === '/admin' ? 700 : 600,
                  color: pathname === '/admin' ? '#fff' : SIDEBAR_TEXT,
                },
              }}
            />
          </ListItemButton>
        </ListItem>
        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} />

        {menuGroups.map((group, groupIndex) => (
          <React.Fragment key={group.label}>
            {groupIndex > 0 && (
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
            )}

            <Box sx={{ px: 3, pt: groupIndex > 0 ? 0.5 : 0, pb: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: SIDEBAR_TEXT_MUTED,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </Typography>
            </Box>

            {group.items.map((item) => {
              const path = getBoothPath(boothId, item.pathSegment)
              const isSelected = pathname === path

              return (
                <ListItem key={item.key} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    onClick={() => router.push(path)}
                    selected={isSelected}
                    sx={{
                      minHeight: 44,
                      ml: 0,
                      mr: 2,
                      px: 0,
                      borderRadius: '0 22px 22px 0',
                      color: isSelected ? '#fff' : SIDEBAR_TEXT,
                      '&:hover': {
                        backgroundColor: isSelected ? SIDEBAR_ACTIVE_BG : SIDEBAR_HOVER_BG,
                      },
                      '&.Mui-selected': {
                        backgroundColor: SIDEBAR_ACTIVE_BG,
                        '&:hover': { backgroundColor: SIDEBAR_ACTIVE_BG },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        ml: '20px',
                        mr: '14px',
                        justifyContent: 'center',
                        color: isSelected ? '#fff' : SIDEBAR_TEXT_MUTED,
                      }}
                    >
                      <item.Icon sx={{ fontSize: '24px' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        '& .MuiTypography-root': {
                          fontSize: '15px',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? '#fff' : SIDEBAR_TEXT,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </React.Fragment>
        ))}
      </List>

    </Drawer>
  )
}
