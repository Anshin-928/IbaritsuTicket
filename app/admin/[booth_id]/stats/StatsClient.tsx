'use client'

import { useState, useMemo } from 'react'
import {
  Box, Typography, IconButton, Paper, Card, CardContent, Stack, Tooltip as MuiTooltip,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { Ticket } from '@/types/database'

interface Props {
  tickets: Ticket[]
}

function toLocalDateStr(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDateJP(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${y}年${m}月${d}日（${days[date.getDay()]}）`
}

function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return toLocalDateStr(new Date(y, m - 1, d + delta))
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}分`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m === 0 ? `${h}時間` : `${h}時間${m}分`
}

/** データがある時間帯の前後1時間を含めてトリミング */
function trimHours<T extends { _count: number }>(hours: T[]): T[] {
  let start = 0, end = hours.length - 1
  while (start < end && hours[start]._count === 0) start++
  while (end > start && hours[end]._count === 0) end--
  if (hours[start]._count === 0) return hours.slice(9, 18) // データなし→デフォルト9〜17時
  return hours.slice(Math.max(0, start - 1), Math.min(hours.length - 1, end + 2))
}

export default function StatsClient({ tickets }: Props) {
  const today = toLocalDateStr(new Date())
  const [selectedDate, setSelectedDate] = useState(today)

  /**
   * registered_at（受付時刻）で日付フィルタする。
   * - registered_at がある場合: 受付登録された日で判定
   * - registered_at がない場合: updated_at で判定（フォールバック）
   */
  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const ts = t.registered_at ?? t.updated_at
      return toLocalDateStr(new Date(ts)) === selectedDate
    })
  }, [tickets, selectedDate])

  const doneTickets = useMemo(() => filtered.filter((t) => t.status === 'done'), [filtered])

  // ── 集計値 ──────────────────────────────────────────────────
  const totalVisitors = filtered.reduce((sum, t) => sum + (t.party_size ?? 0), 0)
  const totalGroups = filtered.length
  const avgPartySize = totalGroups > 0 ? (totalVisitors / totalGroups).toFixed(1) : '—'
  const totalDone = doneTickets.length

  // 平均待ち時間（registered_at → updated_at）
  const avgWaitMin = useMemo(() => {
    const measurable = doneTickets.filter((t) => t.registered_at)
    if (measurable.length === 0) return null
    const totalMs = measurable.reduce((sum, t) => {
      return sum + (new Date(t.updated_at).getTime() - new Date(t.registered_at!).getTime())
    }, 0)
    return totalMs / measurable.length / 1000 / 60
  }, [doneTickets])

  // ── 時間別受付数グラフ（registered_at ベース）──────────────
  const activityData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}時`,
      人数: 0,
      グループ数: 0,
      _count: 0,
    }))
    for (const t of filtered) {
      const ts = t.registered_at ?? t.updated_at
      const h = new Date(ts).getHours()
      hours[h].人数 += t.party_size ?? 0
      hours[h].グループ数 += 1
      hours[h]._count += 1
    }
    return trimHours(hours)
  }, [filtered])

  // ── 時間別完了数グラフ（done の updated_at ベース）+ 平均待ち時間 ──
  const completionData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}時`,
      完了グループ数: 0,
      完了人数: 0,
      _count: 0,
    }))
    for (const t of doneTickets) {
      // 完了時刻: updated_at が正しいが、トリガーで壊れている場合は registered_at にフ��ールバック
      // （バックフィル時に registered_at = 元の updated_at が入っている）
      const doneTs = t.registered_at ?? t.updated_at
      const h = new Date(doneTs).getHours()
      hours[h].完了グループ数 += 1
      hours[h].完了人数 += t.party_size ?? 0
      hours[h]._count += 1
    }
    return trimHours(hours)
  }, [doneTickets])

  const summaryCards = [
    { label: '総来客者数', value: `${totalVisitors}名`, Icon: PeopleOutlinedIcon },
    { label: '総グループ数', value: `${totalGroups}組`, Icon: GroupsOutlinedIcon },
    { label: '平均グループ人数', value: `${avgPartySize}名`, Icon: PersonOutlinedIcon },
    { label: '体験完了グループ数', value: `${totalDone}組`, Icon: CheckCircleOutlinedIcon },
    {
      label: '平均待ち時間',
      value: avgWaitMin !== null ? formatMinutes(avgWaitMin) : '—',
      Icon: TimerOutlinedIcon,
      hint: '受付登録から完了ボタン押下までの平均時間（完了済みのみ）',
    },
  ]

  const noData = filtered.length === 0

  return (
    <Box>
      {/* 日付ナビゲーション */}
      <Box
        display="flex"
        alignItems="center"
        gap={0.5}
        mb={3}
        sx={{
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          px: 1,
          py: 0.5,
          width: 'fit-content',
        }}
      >
        <IconButton size="small" onClick={() => setSelectedDate((d) => addDays(d, -1))}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography fontWeight="bold" fontSize={{ xs: '15px', md: '17px' }} sx={{ px: 1, whiteSpace: 'nowrap' }}>
          {formatDateJP(selectedDate)}
        </Typography>
        <IconButton
          size="small"
          onClick={() => setSelectedDate((d) => addDays(d, 1))}
          disabled={selectedDate >= today}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* サマリーカード */}
      <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
        {summaryCards.map(({ label, value, Icon, hint }) => (
          <Card key={label} sx={{ flex: '1 1 140px', minWidth: 130 }} elevation={2}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" alignItems="center" gap={0.75} mb={0.5}>
                <Icon sx={{ fontSize: '18px', color: '#274a79', opacity: 0.8 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {label}
                </Typography>
                {hint && (
                  <MuiTooltip title={hint} placement="top" arrow>
                    <InfoOutlinedIcon sx={{ fontSize: '14px', color: 'text.disabled', cursor: 'help' }} />
                  </MuiTooltip>
                )}
              </Box>
              <Typography variant="h5" fontWeight="bold" color="#274a79">
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* 時間別受付数グラフ */}
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={0.75} mb={2}>
          <Typography fontWeight="bold" fontSize="15px" color="#1a1a1a">
            時間別受付数
          </Typography>
          <MuiTooltip
            title="受付登録時刻（registered_at）で集計しています。"
            placement="top"
            arrow
          >
            <InfoOutlinedIcon sx={{ fontSize: '16px', color: 'text.disabled', cursor: 'help' }} />
          </MuiTooltip>
        </Box>
        {noData ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={activityData} barGap={0} margin={{ top: 4, right: 16, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} cursor={{ fill: 'rgba(39,74,121,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="人数" fill="#274a79" radius={[4, 4, 0, 0]} />
              <Bar dataKey="グループ数" fill="#82b1d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* 時間別完了数グラフ */}
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={0.75} mb={2}>
          <Typography fontWeight="bold" fontSize="15px" color="#1a1a1a">
            時間別完了数（完了ボタン押下時刻ベース）
          </Typography>
          <MuiTooltip
            title="「完了」ボタンが押された時刻で集計しています。"
            placement="top"
            arrow
          >
            <InfoOutlinedIcon sx={{ fontSize: '16px', color: 'text.disabled', cursor: 'help' }} />
          </MuiTooltip>
        </Box>
        {doneTickets.length === 0 ? (
          <EmptyChart label="完了済みデータがありません" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={completionData} barGap={0} margin={{ top: 4, right: 16, left: -12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 13 }} cursor={{ fill: 'rgba(46,125,50,0.06)' }} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="完了グループ数" fill="#2e7d32" radius={[4, 4, 0, 0]} />
              <Bar dataKey="完了人数" fill="#81c784" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* ステータス別内訳 */}
      {!noData && (
        <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
          <Typography fontWeight="bold" fontSize="15px" mb={2} color="#1a1a1a">
            ステータス別内訳
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {(
              [
                { status: 'done',    label: '体験完了', color: '#2e7d32' },
                { status: 'direct',  label: '直接案内', color: '#1565c0' },
                { status: 'called',  label: '呼出中',   color: '#e65100' },
                { status: 'waiting', label: '待機中',   color: '#6a1b9a' },
                { status: 'on_hold', label: '保留中',   color: '#78909c' },
              ] as const
            ).map(({ status, label, color }) => {
              const count = filtered.filter((t) => t.status === status).length
              if (count === 0) return null
              return (
                <Box
                  key={status}
                  sx={{
                    px: 2, py: 1, borderRadius: 2,
                    bgcolor: `${color}14`,
                    border: '1px solid',
                    borderColor: `${color}40`,
                    minWidth: 100,
                  }}
                >
                  <Typography variant="caption" color={color} fontWeight={700}>{label}</Typography>
                  <Typography fontWeight="bold" color={color} fontSize="20px" lineHeight={1.2}>
                    {count}組
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

function EmptyChart({ label = 'この日のデータはありません' }: { label?: string }) {
  return (
    <Box
      display="flex" alignItems="center" justifyContent="center" height={200}
      sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}
    >
      <Typography color="text.secondary" fontSize="14px">{label}</Typography>
    </Box>
  )
}
