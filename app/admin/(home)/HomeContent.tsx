'use client'

import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
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
          const bgColor = called > 0 ? '#fff8f8' : onHold > 0 ? '#fff8f0' : 'transparent'

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
                backgroundColor: bgColor,
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
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                {called > 0 && (
                  <Chip
                    size="small"
                    label={`呼出中 ${called}組`}
                    sx={{ bgcolor: '#e53935', color: '#fff', fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                  />
                )}
                {onHold > 0 && (
                  <Chip
                    size="small"
                    label={`保留 ${onHold}組`}
                    sx={{ bgcolor: '#ef6c00', color: '#fff', fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                  />
                )}
                <Chip
                  size="small"
                  label={`完了 ${doneToday}組`}
                  sx={{ bgcolor: '#f0f0f0', color: 'text.secondary', fontSize: '0.75rem', height: 22 }}
                />
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
          { label: '現在の待ち', value: totalWaiting, unit: '組', icon: <PeopleOutlinedIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} /> },
          { label: '待ち人数',   value: totalPeople,  unit: '人', icon: <PersonOutlinedIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} /> },
          { label: '本日完了',   value: totalDone,    unit: '組', icon: <CheckCircleOutlinedIcon sx={{ fontSize: '1.3rem', color: 'text.secondary' }} /> },
        ].map(({ label, value, unit, icon }) => (
          <Paper
            key={label}
            elevation={0}
            sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2.5, textAlign: 'center' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
              {icon}
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{label}</Typography>
            </Box>
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
