'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import { supabase } from '@/lib/supabase'
import type { Booth, Ticket } from '@/types/database'

interface TicketViewProps {
  ticket: Ticket
  booth: Booth
}

export default function TicketView({ ticket: initialTicket, booth: initialBooth }: TicketViewProps) {
  const [ticket, setTicket] = useState<Ticket>(initialTicket)
  const [aheadCount, setAheadCount] = useState<number | null>(null)

  const fetchAheadCount = useCallback(async (t: Ticket) => {
    if (t.status !== 'waiting') {
      setAheadCount(null)
      return
    }
    // called の件数 + 自分より ticket_number が小さい waiting の件数
    const [{ count: calledCount }, { count: waitingAheadCount }] = await Promise.all([
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('booth_id', t.booth_id)
        .eq('status', 'called'),
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('booth_id', t.booth_id)
        .eq('status', 'waiting')
        .lt('ticket_number', t.ticket_number),
    ])
    setAheadCount((calledCount ?? 0) + (waitingAheadCount ?? 0))
  }, [])

  const fetchTicket = useCallback(async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticket.id)
      .single()
    if (data) {
      setTicket(data)
      fetchAheadCount(data)
    }
  }, [ticket.id, fetchAheadCount])

  // 初回の ahead count
  useEffect(() => {
    fetchAheadCount(initialTicket)
  }, [initialTicket, fetchAheadCount])

  // バックグラウンドから復帰時に強制フェッチ（iOS Safariでの切断対策）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTicket()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchTicket])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => { fetchTicket() },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [ticket.id, fetchTicket])

  const statusConfig = getStatusConfig(ticket, aheadCount)

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: statusConfig.bg,
        px: 3,
        py: 5,
        transition: 'background-color 0.5s ease',
      }}
    >
      {/* ブース名 */}
      <Typography
        sx={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', mb: 1, letterSpacing: '0.05em' }}
      >
        {initialBooth.name}
      </Typography>

      {/* 整理券ラベル */}
      <Typography
        sx={{ fontSize: '12px', color: '#94a3b8', mb: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}
      >
        整理券
      </Typography>

      {/* 番号 */}
      <Box
        sx={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: statusConfig.circle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 8px 40px ${statusConfig.shadow}`,
          mb: 4,
          transition: 'all 0.5s ease',
        }}
      >
        <Typography sx={{ fontSize: '96px', fontWeight: 700, color: statusConfig.numberColor, lineHeight: 1 }}>
          {ticket.ticket_number}
        </Typography>
      </Box>

      {/* ステータスアイコン + メッセージ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 4 }}>
        <Box sx={{ color: statusConfig.accent, display: 'flex', alignItems: 'center' }}>
          {statusConfig.icon}
        </Box>
        <Typography
          sx={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#1e293b',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          {statusConfig.title}
        </Typography>
        {statusConfig.subtitle && (
          <Typography sx={{ fontSize: '15px', color: '#64748b', textAlign: 'center', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {statusConfig.subtitle}
          </Typography>
        )}
      </Box>

      {/* 待ち人数 */}
      {ticket.status === 'waiting' && aheadCount !== null && (
        <Box
          sx={{
            bgcolor: 'rgba(0,0,0,0.06)',
            borderRadius: '12px',
            px: 4,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            mb: 3,
          }}
        >
          <Typography sx={{ fontSize: '13px', color: '#94a3b8' }}>あなたの前に</Typography>
          <Typography sx={{ fontSize: '40px', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>
            {aheadCount}
          </Typography>
          <Typography sx={{ fontSize: '13px', color: '#94a3b8' }}>組 待っています</Typography>
        </Box>
      )}

      {/* 人数 */}
      {ticket.party_size > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
          <PeopleAltOutlinedIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
          <Typography sx={{ fontSize: '15px', color: '#94a3b8' }}>
            {ticket.party_size}名
          </Typography>
        </Box>
      )}

      {/* 注意事項 */}
      <Box
        sx={{
          mt: 4,
          mx: 1,
          px: 2.5,
          py: 1.75,
          bgcolor: ticket.status === 'called' ? 'rgba(245,158,11,0.12)' : 'rgba(0,0,0,0.04)',
          borderRadius: '10px',
          borderLeft: ticket.status === 'called' ? '3px solid #f59e0b' : '3px solid transparent',
          maxWidth: 340,
        }}
      >
        <Typography
          sx={{
            fontSize: '12px',
            color: ticket.status === 'called' ? '#92400e' : '#94a3b8',
            lineHeight: 1.7,
            textAlign: 'left',
          }}
        >
          ※ お呼び出し後、一定時間内にお越しにならない場合は、キャンセル扱いとなる場合がございます。予めご了承ください。
        </Typography>
      </Box>

      {/* ローディングインジケーター（リアルタイム接続中） */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', alignItems: 'center', gap: 1, opacity: 0.35 }}>
        <CircularProgress size={12} thickness={5} sx={{ color: '#94a3b8' }} />
        <Typography sx={{ fontSize: '11px', color: '#64748b' }}>リアルタイム更新中</Typography>
      </Box>
    </Box>
  )
}

interface StatusConfig {
  bg: string
  circle: string
  shadow: string
  accent: string
  numberColor: string
  textMain: string
  textSub: string
  icon: React.ReactNode
  title: string
  subtitle?: string
}

function getStatusConfig(ticket: Ticket, aheadCount: number | null): StatusConfig {
  switch (ticket.status) {
    case 'called':
      return {
        bg: '#fffbeb',
        circle: '#f59e0b',
        shadow: 'rgba(0,0,0,0.12)',
        accent: '#f59e0b',
        numberColor: '#fff',
        textMain: '#1e293b',
        textSub: '#64748b',
        icon: <NotificationsActiveIcon sx={{ fontSize: 52 }} />,
        title: 'お呼びしています！',
        subtitle: 'スタッフにお声がけください\nまたはブース受付へお越しください',
      }
    case 'on_hold':
      return {
        bg: '#fafaf9',
        circle: '#f97316',
        shadow: 'rgba(0,0,0,0.12)',
        accent: '#f97316',
        numberColor: '#fff',
        textMain: '#1e293b',
        textSub: '#64748b',
        icon: <PauseCircleOutlineIcon sx={{ fontSize: 52 }} />,
        title: '保留中',
        subtitle: 'お呼びした際に不在でした\nお戻りの際はスタッフまで\nお声がけください',
      }
    case 'done':
    case 'direct':
      return {
        bg: '#f0fdf4',
        circle: '#22c55e',
        shadow: 'rgba(0,0,0,0.10)',
        accent: '#22c55e',
        numberColor: '#fff',
        textMain: '#1e293b',
        textSub: '#64748b',
        icon: <CheckCircleOutlineIcon sx={{ fontSize: 52 }} />,
        title: 'ご案内済みです',
        subtitle: 'ありがとうございました！',
      }
    case 'waiting':
    default:
      return {
        bg: '#f8fafc',
        circle: '#3b82f6',
        shadow: 'rgba(0,0,0,0.10)',
        accent: '#3b82f6',
        numberColor: '#fff',
        textMain: '#1e293b',
        textSub: '#64748b',
        icon: <HourglassTopIcon sx={{ fontSize: 48 }} />,
        title: aheadCount === 0 ? 'もうすぐご案内します' : '順番待ち中です',
        subtitle:
          aheadCount === 0
            ? 'ブース付近でお待ちください'
            : 'お名前をお呼びするまでしばらくお待ちください',
      }
  }
}
