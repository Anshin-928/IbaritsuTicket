'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import { keyframes } from '@mui/system'
import { supabase } from '@/lib/supabase'
import type { Booth, Ticket } from '@/types/database'

const pulseAnim = keyframes`
  0%   { transform: scale(1);   opacity: 0.5; }
  100% { transform: scale(1.25); opacity: 0;   }
`

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

  const cfg = getStatusConfig(ticket, aheadCount)

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
      {/* イベント名 */}
      <Typography
        sx={{
          fontSize: '16px',
          fontWeight: 500,
          color: '#6b6b68',
          letterSpacing: '0.06em',
          mb: 0.5,
        }}
      >
        いばらき ✕ 立命館DAY 2026
      </Typography>

      {/* ブース名 */}
      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#1c1c1a',
          letterSpacing: '0.04em',
          mb: 4,
        }}
      >
        {initialBooth.name}
      </Typography>

      {/* 番号サークル + パルスリング（called のみ） */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 168,
          height: 168,
          mb: 4,
        }}
      >
        {/* パルスリング（called 時のみ表示） */}
        {ticket.status === 'called' && (
          <>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `1.5px solid ${cfg.accent}`,
                animation: `${pulseAnim} 1.8s ease-out infinite`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `1.5px solid ${cfg.accent}`,
                animation: `${pulseAnim} 1.8s ease-out 0.9s infinite`,
              }}
            />
          </>
        )}

        {/* 番号サークル */}
        <Box
          sx={{
            width: 168,
            height: 168,
            borderRadius: '50%',
            border: `1.5px ${cfg.borderStyle} ${cfg.accent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.4s ease',
          }}
        >
          <Typography
            sx={{
              fontSize: ticket.ticket_number >= 100 ? '72px' : '100px',
              fontWeight: 500,
              color: cfg.numberColor,
              lineHeight: 1,
              transition: 'color 0.4s ease',
            }}
          >
            {ticket.ticket_number}
          </Typography>
        </Box>
      </Box>

      {/* ステータスタイトル */}
      <Typography
        sx={{
          fontSize: '26px',
          fontWeight: 500,
          color: cfg.titleColor,
          lineHeight: 1.3,
          mb: 2.5,
          textAlign: 'center',
        }}
      >
        {cfg.title}
      </Typography>

      {/* 待ち人数（枠なし・インライン表示） */}
      {ticket.status === 'waiting' && aheadCount !== null && aheadCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.75,
            mb: 1,
          }}
        >
          <Typography sx={{ fontSize: '48px', fontWeight: 500, color: '#1c1c1a', lineHeight: 1 }}>
            {aheadCount}
          </Typography>
          <Typography sx={{ fontSize: '18px', color: 'text.secondary' }}>
            組が先に待っています
          </Typography>
        </Box>
      )}

      {/* サブテキスト */}
      {cfg.subtitle && (
        <Typography
          sx={{
            fontSize: '18px',
            color: 'text.secondary',
            textAlign: 'center',
            lineHeight: 1.65,
            whiteSpace: 'pre-line',
            maxWidth: 280,
            mb: 2.5,
          }}
        >
          {cfg.subtitle}
        </Typography>
      )}

      {/* 人数 */}
      {ticket.party_size > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2.5 }}>
          <PeopleAltOutlinedIcon sx={{ fontSize: '21px', color: 'text.secondary' }} />
          <Typography sx={{ fontSize: '20px', color: 'text.secondary' }}>
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
            fontSize: '11px',
            color: ticket.status === 'called' ? '#c97028' : '#7a7874',
            lineHeight: 1.7,
            textAlign: 'left',
            transition: 'color 0.4s ease',
          }}
        >
          ※ お呼び出し後、一定時間内にお越しにならない場合は、キャンセル扱いとなる場合がございます。予めご了承ください。
        </Typography>
      </Box>
    </Box>
  )
}

interface StatusConfig {
  accent: string
  borderStyle: 'solid' | 'dashed'
  numberColor: string
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
        titleColor: '#c97028',
        title: 'お呼びしています',
        subtitle: 'お待たせいたしました。\n受付までお越しください。',
      }
    case 'on_hold':
      return {
        accent: '#b0aea8',
        borderStyle: 'dashed',
        numberColor: '#8a8a86',
        titleColor: '#6b6b68',
        title: '保留中',
        subtitle: 'お呼びした際に不在でした。\nお戻りの際はスタッフまでお声がけください。',
      }
    case 'done':
    case 'direct':
      return {
        accent: '#7aaa6a',
        borderStyle: 'solid',
        numberColor: '#7aaa6a',
        titleColor: '#7aaa6a',
        title: 'ご案内済みです',
        subtitle: 'ありがとうございました',
      }
    case 'waiting':
    default:
      return {
        accent: '#b0aea8',
        borderStyle: 'solid',
        numberColor: '#1c1c1a',
        titleColor: '#1c1c1a',
        title: aheadCount === 0 ? 'まもなくご案内いたします' : '順番待ち中',
        subtitle:
          aheadCount === 0
            ? 'ブース付近でお待ちください'
            : undefined,
      }
  }
}