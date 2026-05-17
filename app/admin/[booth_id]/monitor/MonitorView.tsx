// app/admin/[booth_id]/monitor/MonitorView.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import { supabase } from '@/lib/supabase'
import { useMonitorBadge } from '@/context/monitorBadge'
import type { Booth, Ticket } from '@/types/database'

interface MonitorViewProps {
  booth: Booth
  initialTickets: Ticket[]
}

export default function MonitorView({ booth, initialTickets }: MonitorViewProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const { setWaitingCount } = useMonitorBadge()

  const fetchTickets = useCallback(async () => {
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('booth_id', booth.id)
      .in('status', ['called', 'waiting', 'on_hold'])
      .order('ticket_number', { ascending: true })
    if (data) setTickets(data)
  }, [booth.id])

  useEffect(() => {
    const channel = supabase
      .channel(`monitor-${booth.id}`)
      .on(
        'postgres_changes',
        // filter なしで tickets 全体を購読（filtered subscription は REPLICA IDENTITY FULL が必要なため）
        { event: '*', schema: 'public', table: 'tickets' },
        () => { fetchTickets() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [booth.id, fetchTickets])

  const calledTickets  = tickets.filter((t) => t.status === 'called')
  const waitingTickets = tickets.filter((t) => t.status === 'waiting')
  const onHoldTickets  = tickets.filter((t) => t.status === 'on_hold')
  const waitingCount   = calledTickets.length + waitingTickets.length

  // 新しく called に移動したチケットを検出して点滅させる
  const prevCalledIdsRef = useRef<Set<string>>(new Set(initialTickets.filter((t) => t.status === 'called').map((t) => t.id)))
  const [blinkingIds, setBlinkingIds] = useState<Set<string>>(new Set())

  const calledIdStr = calledTickets.map((t) => t.id).join(',')
  useEffect(() => {
    if (!calledIdStr) {
      prevCalledIdsRef.current = new Set()
      return
    }
    const currentIds = new Set(calledIdStr.split(','))
    const newIds = [...currentIds].filter((id) => !prevCalledIdsRef.current.has(id))
    prevCalledIdsRef.current = currentIds

    if (newIds.length > 0) {
      setBlinkingIds(new Set(newIds))
      const timer = setTimeout(() => setBlinkingIds(new Set()), 1200)
      return () => clearTimeout(timer)
    }
  }, [calledIdStr])

  // AppBar のバッジカウントを Context 経由で更新
  useEffect(() => { setWaitingCount(waitingCount) }, [waitingCount, setWaitingCount])

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f0f2f5', overflow: 'hidden' }}>

      {/* ボディ */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flexGrow: 1, minHeight: 0 }}>

        {/* 左：呼び出し中 */}
        <Box sx={{
          bgcolor: '#ffffff', borderRight: '1px solid #e8e8e8',
          p: { xs: '10px', md: '28px' }, display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 2 },
          overflow: 'hidden',
        }}>
          {/* セクションラベル */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 4, height: { xs: 16, md: 22 }, borderRadius: 99, bgcolor: '#356ae5', flexShrink: 0 }} />
            <Typography sx={{ fontSize: { xs: '18px', md: '28px' }, fontWeight: 'bold', color: '#555', letterSpacing: '0.04em' }}>
              <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>ご案内中の番号</Box>
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>ただいまご案内中の番号</Box>
            </Typography>
          </Box>

          {/* 呼び出し中カード */}
          {calledTickets.length === 0 ? (
            <Box sx={{ py: 2 }} />
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: '8px', md: '12px' }, overflowY: 'auto' }}>
              {calledTickets.map((t) => (
                <Box key={t.id} sx={{
                  position: 'relative',
                  width: { xs: 100, md: 160 }, height: { xs: 100, md: 160 },
                  bgcolor: '#fdffff', border: '2.5px solid #2e5bc5', borderRadius: '10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 6px rgba(0,0,0,0.1)',
                  ...(blinkingIds.has(t.id) && {
                    animation: 'blink 0.4s ease-in-out 3',
                    '@keyframes blink': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.2 },
                    },
                  }),
                }}>
                  <Typography sx={{ fontSize: { xs: '52px', md: '80px' }, fontWeight: 500, color: '#1d3776', lineHeight: 1, mb: { xs: '14px', md: '20px' } }}>
                    {t.ticket_number}
                  </Typography>
                  <Box sx={{ position: 'absolute', bottom: { xs: 6, md: 10 }, right: { xs: 7, md: 12 }, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <PeopleAltOutlinedIcon sx={{ fontSize: { xs: '12px', md: '16px' }, color: '#1d3776' }} />
                    <Typography sx={{ fontSize: { xs: '13px', md: '18px' }, color: '#1d3776' }}>{t.party_size}人</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* 右：順番待ち一覧 */}
        <Box sx={{
          bgcolor: '#fafafa',
          pt: { xs: '10px', md: '28px' }, px: { xs: '10px', md: '28px' }, pb: 0,
          display: 'flex', flexDirection: 'column', gap: { xs: 1, md: 1.5 },
          overflow: 'hidden',
        }}>
          {/* セクションラベル */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Box sx={{ width: 4, height: { xs: 16, md: 22 }, borderRadius: 99, bgcolor: '#000000', flexShrink: 0 }} />
            <Typography sx={{ fontSize: { xs: '18px', md: '28px' }, fontWeight: 'bold', color: '#555', letterSpacing: '0.04em' }}>
              順番待ちの方
            </Typography>
          </Box>

          {/* 待ちカード */}
          <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
            {waitingTickets.length === 0 ? (
              <Box sx={{ py: 2 }} />
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: '8px', md: '12px' } }}>
                {waitingTickets.map((t) => (
                  <Box key={t.id} sx={{
                    position: 'relative',
                    width: { xs: 82, md: 140 }, height: { xs: 82, md: 140 },
                    bgcolor: '#fff', border: '2px solid #000000', borderRadius: '10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 6px rgba(0,0,0,0.1)',
                  }}>
                    <Typography sx={{ fontSize: { xs: '40px', md: '64px' }, fontWeight: 500, color: '#1a1a1a', lineHeight: 1, mb: { xs: '12px', md: '20px' } }}>
                      {t.ticket_number}
                    </Typography>
                    <Box sx={{ position: 'absolute', bottom: { xs: 5, md: 8 }, right: { xs: 6, md: 10 }, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <PeopleAltOutlinedIcon sx={{ fontSize: { xs: '10px', md: '14px' }, color: 'secondary' }} />
                      <Typography sx={{ fontSize: { xs: '11px', md: '18px' }, color: 'secondary' }}>{t.party_size}人</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* 保留セクション（on_hold がある場合のみ表示）*/}
      {onHoldTickets.length > 0 && (
        <Box sx={{
          borderTop: '1px solid #e8e8e8',
          px: { xs: '10px', md: '28px' }, py: { xs: 1, md: 2 },
          bgcolor: '#fffcf5',
          display: 'flex', flexDirection: 'column', gap: 1,
          flexShrink: 0,
          position: 'relative', zIndex: 1,
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 4, height: { xs: 16, md: 20 }, borderRadius: 99, bgcolor: '#ef6c00', flexShrink: 0 }} />
              <Typography sx={{ fontSize: { xs: '16px', md: '24px' }, fontWeight: 'bold', color: '#bf5000', letterSpacing: '0.03em' }}>
                不在のため保留中のお客様
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '14px', md: '20px' }, fontWeight: 'bold', color: '#bf5000', opacity: 0.75, ml: '12px', mt: '2px' }}>
              先ほどお呼びしましたが不在でした。<Box component="br" sx={{ display: { xs: 'block', md: 'none' } }} />お戻りの際はスタッフまでお声がけください。
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '8px', pb: '4px' }}>
            {onHoldTickets.map((t) => (
              <Box key={t.id} sx={{
                position: 'relative',
                width: { xs: 72, md: 100 }, minWidth: { xs: 72, md: 100 }, height: { xs: 72, md: 100 },
                bgcolor: '#fff', border: '1.5px solid #ef6c00', borderRadius: '8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 1px 6px rgba(0,0,0,0.1)',
              }}>
                <Typography sx={{ fontSize: { xs: '34px', md: '50px' }, fontWeight: 'bold', color: '#bf5000', lineHeight: 1, mb: { xs: '12px', md: '18px' } }}>
                  {t.ticket_number}
                </Typography>
                <Box sx={{ position: 'absolute', bottom: { xs: 4, md: 7 }, right: { xs: 5, md: 9 }, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <PeopleAltOutlinedIcon sx={{ fontSize: { xs: '13px', md: '16px' }, color: '#bf5000', opacity: 0.6 }} />
                  <Typography sx={{ fontSize: { xs: '12px', md: '16px' }, color: '#bf5000', opacity: 0.6 }}>{t.party_size}人</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}
