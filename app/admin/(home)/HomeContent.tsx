'use client'

import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import type { Booth } from '@/types/database'

type TicketSummary = {
  booth_id: string
  status: string
  party_size: number
}

interface Props {
  booths: Booth[]
  ticketSummaries: TicketSummary[]
  fetchError?: string
}

export default function HomeContent({ booths, ticketSummaries, fetchError }: Props) {
  const router = useRouter()

  if (fetchError) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        データの取得に失敗しました: {fetchError}
      </Alert>
    )
  }

  if (booths.length === 0) {
    return <Alert severity="info">ブースが登録されていません。</Alert>
  }

  const totalWaiting = ticketSummaries.filter(t => t.status === 'waiting' || t.status === 'called').length
  const totalPeople  = ticketSummaries.filter(t => t.status === 'waiting' || t.status === 'called').reduce((s, t) => s + (t.party_size ?? 0), 0)
  const totalDone    = ticketSummaries.filter(t => t.status === 'done').length

  return (
    <Box>
      {/* ブース一覧 */}
      <Typography fontWeight="bold" sx={{ mb: 2, fontSize: '0.9rem', color: 'text.secondary', letterSpacing: '0.05em' }}>
        ブース一覧
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2, mb: 4 }}>
        {booths.map(booth => {
          const bt        = ticketSummaries.filter(t => t.booth_id === booth.id)
          const waiting   = bt.filter(t => t.status === 'waiting').length
          const called    = bt.filter(t => t.status === 'called').length
          const onHold    = bt.filter(t => t.status === 'on_hold').length
          const doneToday = bt.filter(t => t.status === 'done').length
          return (
            <Paper
              key={booth.id}
              elevation={0}
              onClick={() => router.push(`/admin/${booth.id}/dashboard`)}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                p: 2.5,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, border-color 0.15s',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderColor: '#bbb' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography fontWeight="bold" fontSize="1.05rem" sx={{ lineHeight: 1.3 }}>
                  {booth.name}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                <Typography sx={{ fontSize: '2.8rem', fontWeight: 'bold', lineHeight: 1 }}>
                  {waiting + called}
                </Typography>
                <Typography sx={{ fontSize: '1rem', color: 'text.secondary' }}>組待ち</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1.25, flexWrap: 'wrap' }}>
                {called > 0 && (
                  <Typography sx={{ fontSize: '0.8rem', color: '#e53935', fontWeight: 600 }}>
                    呼出中 {called}組
                  </Typography>
                )}
                {onHold > 0 && (
                  <Typography sx={{ fontSize: '0.8rem', color: '#ef6c00', fontWeight: 600 }}>
                    保留 {onHold}組
                  </Typography>
                )}
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  本日完了 {doneToday}組
                </Typography>
              </Box>
            </Paper>
          )
        })}
      </Box>

      {/* 全体集計 */}
      <Typography fontWeight="bold" sx={{ mb: 2, fontSize: '0.9rem', color: 'text.secondary', letterSpacing: '0.05em' }}>
        全体集計
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {[
          { label: '現在の待ち', value: totalWaiting, unit: '組' },
          { label: '待ち人数',   value: totalPeople,  unit: '人' },
          { label: '本日完了',   value: totalDone,    unit: '組' },
        ].map(({ label, value, unit }) => (
          <Paper
            key={label}
            elevation={0}
            sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2.5, textAlign: 'center' }}
          >
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>{value}</Typography>
              <Typography sx={{ fontSize: '1rem', color: 'text.secondary' }}>{unit}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}
