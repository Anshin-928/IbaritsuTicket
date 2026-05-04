'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
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
        bgcolor: '#f5f4f1',
        px: 3,
        py: 5,
      }}
    >
      {/* ブース名 */}
      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 500,
          color: '#6b6b68',
          mb: 0.5,
          letterSpacing: '0.08em',
        }}
      >
        {initialBooth.name}
      </Typography>

      {/* 整理券ラベル */}
      <Typography
        sx={{
          fontSize: '18px',
          color: '#8a8a86',
          mb: 3.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        整理券
      </Typography>

      {/* 番号サークル（枠線のみ） */}
      <Box
        sx={{
          width: 222,
          height: 222,
          borderRadius: '50%',
          border: `1.5px ${statusConfig.borderStyle} ${statusConfig.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3.5,
          transition: 'border-color 0.4s ease',
        }}
      >
        <Typography
          sx={{
            fontSize: '120px',
            fontWeight: 500,
            color: statusConfig.numberColor,
            lineHeight: 1,
            transition: 'color 0.4s ease',
          }}
        >
          {ticket.ticket_number}
        </Typography>
      </Box>

      {/* ステータスドット + タイトル */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: '50%',
            bgcolor: statusConfig.dotFilled ? statusConfig.accent : 'transparent',
            border: statusConfig.dotFilled ? 'none' : `1.5px solid ${statusConfig.accent}`,
            flexShrink: 0,
            transition: 'background-color 0.4s ease, border-color 0.4s ease',
          }}
        />
        <Typography
          sx={{
            fontSize: '26px',
            fontWeight: 500,
            color: statusConfig.titleColor,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
          }}
        >
          {statusConfig.title}
        </Typography>
      </Box>

      {/* サブテキスト */}
      {statusConfig.subtitle && (
        <Typography
          sx={{
            fontSize: '21px',
            color: '#8a8a86',
            textAlign: 'center',
            lineHeight: 1.65,
            whiteSpace: 'pre-line',
            mb: 2.5,
          }}
        >
          {statusConfig.subtitle}
        </Typography>
      )}

      {/* 待ち人数 */}
      {ticket.status === 'waiting' && aheadCount !== null && aheadCount > 0 && (
        <Box
          sx={{
            border: '0.5px solid #d8d6d0',
            borderRadius: '12px',
            px: 3.5,
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.25,
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: '18px', color: '#8a8a86' }}>あなたの前に</Typography>
          <Typography sx={{ fontSize: '60px', fontWeight: 500, color: '#1c1c1a', lineHeight: 1 }}>
            {aheadCount}
          </Typography>
          <Typography sx={{ fontSize: '18px', color: '#8a8a86' }}>組 待っています</Typography>
        </Box>
      )}

      {/* 人数 */}
      {ticket.party_size > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2.5 }}>
          <PeopleAltOutlinedIcon sx={{ fontSize: '21px', color: '#8a8a86' }} />
          <Typography sx={{ fontSize: '20px', color: '#8a8a86' }}>
            {ticket.party_size}名
          </Typography>
        </Box>
      )}

      {/* 注意事項 */}
      <Box
        sx={{
          borderTop: `0.5px solid ${ticket.status === 'called' ? '#e8b870' : '#d8d6d0'}`,
          pt: 1.75,
          maxWidth: 360,
          width: '100%',
          mt: 'auto',
        }}
      >
        <Typography
          sx={{
            fontSize: '17px',
            color: ticket.status === 'called' ? '#c97028' : '#7a7874',
            lineHeight: 1.7,
            textAlign: 'left',
            transition: 'color 0.4s ease',
          }}
        >
          ※ お呼び出し後、一定時間内にお越しにならない場合は、キャンセル扱いとなる場合がございます。予めご了承ください。
        </Typography>
      </Box>

      {/* リアルタイム更新インジケーター */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          mt: 1.75,
          opacity: 0.45,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#b0aea8',
          }}
        />
        <Typography sx={{ fontSize: '15px', color: '#8a8a86' }}>リアルタイム更新中</Typography>
      </Box>
    </Box>
  )
}

interface StatusConfig {
  accent: string
  borderStyle: 'solid' | 'dashed'
  numberColor: string
  dotFilled: boolean
  titleColor: string
  title: string
  subtitle?: string
}

function getStatusConfig(ticket: Ticket, aheadCount: number | null): StatusConfig {
  switch (ticket.status) {
    case 'called':
      return {
        accent: '#c97028',
        borderStyle: 'solid',
        numberColor: '#c97028',
        dotFilled: true,
        titleColor: '#1c1c1a',
        title: 'お呼びしています',
        subtitle: 'お待たせいたしました。\nお客様のご案内順となりましたので、受付までお越しください。',
      }
    case 'on_hold':
      return {
        accent: '#b0aea8',
        borderStyle: 'dashed',
        numberColor: '#8a8a86',
        dotFilled: false,
        titleColor: '#6b6b68',
        title: '保留中',
        subtitle: 'お呼びした際に不在でした。\nお戻りの際はスタッフまで\nお声がけください',
      }
    case 'done':
    case 'direct':
      return {
        accent: '#7aaa6a',
        borderStyle: 'solid',
        numberColor: '#7aaa6a',
        dotFilled: true,
        titleColor: '#1c1c1a',
        title: 'ご案内済みです',
        subtitle: 'ありがとうございました',
      }
    case 'waiting':
    default:
      return {
        accent: '#b0aea8',
        borderStyle: 'solid',
        numberColor: '#1c1c1a',
        dotFilled: true,
        titleColor: '#1c1c1a',
        title: aheadCount === 0 ? 'まもなくご案内いたします' : '順番待ち中',
        subtitle:
          aheadCount === 0
            ? 'ブース付近でお待ちください'
            : '番号をお呼びするまでしばらくお待ちください',
      }
  }
}