// app/admin/[booth_id]/BoothDashboard.tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import UndoIcon from '@mui/icons-material/Undo'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import type { Booth, Ticket } from '@/types/database'
import {
  callSpecificTicket,
  completeTicket,
  returnToWaiting,
  holdTicket,
} from './actions'
import { issueTicket } from './checkin/actions'
import { playAnnouncement } from '@/lib/playAnnouncement'

// デザイン
const BLUE            = '#3b72bb'
const GREEN_BTN       = '#45a149'
const GREEN_BTN_HOVER = '#39863d'
const TAB_ACTIVE_BG   = '#3b72bb'
const TAB_INACTIVE_BG = '#e0e0e0'
const ROW_CALLED_BG   = '#fff8f8'
const ROW_HOLD_BG     = '#fffcf0'

interface BoothDashboardProps {
  booth: Booth
  tickets: Ticket[]
}

export default function BoothDashboard({ booth, tickets }: BoothDashboardProps) {
  const [partySize, setPartySize] = useState(1)
  const [issueSuspended, setIssueSuspended] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [announcementEnabled, setAnnouncementEnabled] = useState(true)

  useEffect(() => {
    const storedSuspended = localStorage.getItem(`issueSuspended:${booth.id}`)
    if (storedSuspended !== null) setIssueSuspended(storedSuspended === 'true')
    const storedAnnouncement = localStorage.getItem(`announcement:${booth.id}`)
    if (storedAnnouncement !== null) setAnnouncementEnabled(storedAnnouncement === 'true')
  }, [booth.id])
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const [issuePending, startIssueTransition] = useTransition()

  const activeTickets  = tickets.filter((t) => t.status === 'waiting' || t.status === 'called')
  const onHoldTickets  = tickets.filter((t) => t.status === 'on_hold')
  const calledTickets  = tickets.filter((t) => t.status === 'called')
  const waitingTickets = tickets.filter((t) => t.status === 'waiting')
  const totalPeople    = [...calledTickets, ...waitingTickets].reduce((s, t) => s + (t.party_size ?? 0), 0)

  const handleIssue = () => {
    startIssueTransition(async () => {
      const res = await issueTicket(booth.id, partySize)
      if (res.type === 'issued') {
        setSnackbar({ message: `${res.ticketNumber}番 を発券しました`, severity: 'success' })
        setPartySize(1)
      } else {
        setSnackbar({ message: res.message, severity: 'error' })
      }
    })
  }

  return (
    <Box sx={{ display: { xs: 'block', md: 'flex' }, flexGrow: 1, minHeight: { xs: 'auto', md: 0 }, overflow: { xs: 'visible', md: 'hidden' } }}>
      {/* 左パネル */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: 'auto', md: 0 }, p: { xs: 1, md: 2 }, gap: 2 }}>

        {/* 上段：待ち組数 ＋ 発券モードトグル */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'start' }}>

          {/* 待ち組数 */}
          <Box>
            <Typography sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontWeight: 600, fontSize: '1rem', mb: 0.25 }}>
              <PeopleOutlineOutlinedIcon sx={{ fontSize: 30, mr: 0.5}} />
              現在の待ち組
            </Typography>
            <Box display="flex" alignItems="baseline" gap={1}>
              <Typography sx={{ fontSize: '4rem', fontWeight: 'bold', color: '#111', lineHeight: 1 }}>
                {waitingTickets.length + calledTickets.length}
              </Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 'bold', color: '#111', lineHeight: 1 }}>
                組
              </Typography>
              <Typography sx={{ fontSize: '1.2rem', color: 'text.secondary' }}>
                （{totalPeople}人）
              </Typography>
            </Box>
          </Box>

          {/* 発券モードトグル */}
          <Box sx={{ justifySelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '1rem', mb: 1.5 }}>
              本日の発券
            </Typography>
            <Box display="flex" gap={3}>
              {[
                { label: '発券する', suspended: false },
                { label: '停止する', suspended: true },
              ].map((opt) => {
                const active = issueSuspended === opt.suspended
                return (
                  <Box
                    key={opt.label}
                    onClick={() => {
                      setIssueSuspended(opt.suspended)
                      localStorage.setItem(`issueSuspended:${booth.id}`, String(opt.suspended))
                    }}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, cursor: 'pointer', userSelect: 'none' }}
                  >
                    <Box
                      sx={{
                        width: 22, height: 22, borderRadius: '50%',
                        border: `3px solid ${active ? BLUE : '#bbb'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {active && (
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: BLUE }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: active ? 700 : 400, color: active ? BLUE : 'text.secondary' }}>
                      {opt.label}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>

        {/* タブ ＋ チケットリスト */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: 'auto', md: 0 } }}>

          {/* タブヘッダー */}
          <Box sx={{ display: 'flex', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
            {[
              { label: `順番待ち（${activeTickets.length}組）`, idx: 0 },
              { label: `保留（${onHoldTickets.length}組）`, idx: 1 },
            ].map(({ label, idx }) => {
              const active = activeTab === idx
              return (
                <Box
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  sx={{
                    flex: 1,
                    py: 1.1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: active ? TAB_ACTIVE_BG : TAB_INACTIVE_BG,
                    color: active ? '#fff' : '#555',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    transition: 'background 0.2s, color 0.2s',
                    userSelect: 'none',
                  }}
                >
                  {label}
                </Box>
              )
            })}
          </Box>

          {/* チケット一覧 */}
          <Box
            sx={{
              flex: 1,
              overflowY: { xs: 'visible', md: 'auto' },
              border: '1px solid #e0e0e0',
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              bgcolor: '#fafafa',
            }}
          >
            {activeTab === 0 && (
              <>
                {activeTickets.length === 0 && (
                  <Box display="flex" alignItems="center" justifyContent="center" height={120}>
                    <Typography color="text.disabled">現在の待ちはありません</Typography>
                  </Box>
                )}
                {activeTickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} boothId={booth.id} announcementEnabled={announcementEnabled} onError={(msg) => setSnackbar({ message: msg, severity: 'error' })} />
                ))}
              </>
            )}
            {activeTab === 1 && (
              <>
                {onHoldTickets.length === 0 && (
                  <Box display="flex" alignItems="center" justifyContent="center" height={120}>
                    <Typography color="text.disabled">保留中の整理券はありません</Typography>
                  </Box>
                )}
                {onHoldTickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} boothId={booth.id} announcementEnabled={announcementEnabled} onError={(msg) => setSnackbar({ message: msg, severity: 'error' })} />
                ))}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* 点線の縦区切り（デスクトップのみ） */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: 0,
          borderLeft: '2px dashed #c8c8c8',
          alignSelf: 'stretch',
          my: 2,
          flexShrink: 0,
        }}
      />

      {/* 右パネル：発券フォーム */}
      <Box sx={{
        width: { xs: '100%', md: '22%' },
        minWidth: { xs: 0, md: 220 },
        maxWidth: { xs: '100%', md: 320 },
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 1.5, md: 2.5 },
        gap: 2.5,
        borderTop: { xs: '2px dashed #c8c8c8', md: 'none' },
      }}>

        <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#111' }}>
          発券する
        </Typography>

        {/* 人数選択 */}
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: '1rem', mb: 1.5 }}>
            人数を入力してください
          </Typography>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>減らす</Typography>
              <IconButton
                onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                sx={{ bgcolor: BLUE, borderRadius: 1, width: 52, height: 52, color: '#fff', '&:hover': { bgcolor: '#133b6b' } }}
              >
                <RemoveIcon fontSize="large" />
              </IconButton>
            </Box>

            <Box
              sx={{
                border: '2px solid #333', borderRadius: 1, minWidth: 68, height: 68,
                display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff',
              }}
            >
              <Typography sx={{ fontSize: '2.6rem', fontWeight: 'bold', color: '#111', lineHeight: 1 }}>
                {partySize}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>増やす</Typography>
              <IconButton
                onClick={() => setPartySize((p) => p + 1)}
                sx={{ bgcolor: BLUE, borderRadius: 1, width: 52, height: 52, color: '#fff', '&:hover': { bgcolor: '#133b6b' } }}
              >
                <AddIcon fontSize="large" />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* 発券ボタン */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={issueSuspended || issuePending}
          onClick={handleIssue}
          sx={{
            bgcolor: issueSuspended ? '#aaa' : GREEN_BTN,
            color: '#fff',
            py: 1.75,
            borderRadius: 1,
            boxShadow: 'none',
            mt: 'auto',
            '&:hover': { bgcolor: issueSuspended ? '#aaa' : GREEN_BTN_HOVER, boxShadow: 'none' },
            '&.Mui-disabled': { bgcolor: '#ddd', color: 'rgba(0,0,0,0.35)' },
          }}
        >
          {issuePending ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} sx={{ color: '#fff' }} />
              <span>処理中...</span>
            </Box>
          ) : issueSuspended ? (
            <Typography sx={{ fontSize: '1rem', fontWeight: 'bold' }}>発券停止中</Typography>
          ) : (
            <Box sx={{ textAlign: 'center', lineHeight: 1.4 }}>
              <Typography sx={{ fontSize: '1rem', opacity: 0.85 }}>この内容で</Typography>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>発券する</Typography>
            </Box>
          )}
        </Button>
      </Box>

      {/* スナックバー通知 */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar?.severity} onClose={() => setSnackbar(null)} variant="filled">
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// チケット1行分
function TicketRow({ ticket, boothId, announcementEnabled, onError }: { ticket: Ticket; boothId: string; announcementEnabled: boolean; onError: (message: string) => void }) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const isCalled  = ticket.status === 'called'
  const isOnHold  = ticket.status === 'on_hold'

  const rowBg      = isCalled ? ROW_CALLED_BG : isOnHold ? ROW_HOLD_BG : '#fff'
  const leftBorder = isCalled ? '4px solid #e53935' : isOnHold ? '4px solid #ef6c00' : '4px solid transparent'

  const badgeBg    = isCalled ? '#fcebeb' : isOnHold ? '#faeeda' : '#e6f1fb'
  const badgeColor = isCalled ? '#a32d2d' : isOnHold ? '#854f0b' : '#185fa5'
  const badgeLabel = isCalled ? '呼出中' : isOnHold ? '保留' : '待ち'

  const timeStr = new Date(ticket.updated_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'stretch',
        borderBottom: '1px solid #e8e8e8',
        bgcolor: rowBg,
        borderLeft: leftBorder,
        opacity: isPending ? 0.5 : 1,
        transition: 'opacity 0.2s',
        minHeight: { xs: 80, md: 96 },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* 左：縦長ボタン（アイコン上・テキスト下） */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 0.5, md: 1.5 },
        }}
      >
        {isCalled ? (
          <Button
            variant="outlined"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              try { await returnToWaiting(ticket.id, boothId) }
              catch { onError('操作に失敗しました。再度お試しください。') }
            })}
            sx={{
              color: '#999',
              borderColor: '#ddd',
              my: { xs: 0.5, md: 1 },
              ml: '0.5rem',
              width: { xs: 48, md: 64 },
              height: 100,
              flexDirection: 'column',
              gap: 0.5,
              fontSize: '0.85rem',
              fontWeight: 'bold',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              minWidth: 0,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: '#bbb', boxShadow: 'none' },
            }}
          >
            <UndoIcon sx={{ fontSize: { xs: 18, md: 22 } }} />
            取消
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              try {
                await callSpecificTicket(ticket.id, boothId)
                playAnnouncement(ticket.ticket_number, ticket.party_size ?? 0, announcementEnabled)
              }
              catch { onError('操作に失敗しました。再度お試しください。') }
            })}
            sx={{
              bgcolor: '#e53935',
              color: '#fff',
              my: { xs: 0.5, md: 1 },
              ml: '0.5rem',
              width: { xs: 48, md: 64 },
              height: 100,
              flexDirection: 'column',
              gap: 0.5,
              fontSize: '0.85rem',
              fontWeight: 'bold',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              minWidth: 0,
              '&:hover': { bgcolor: '#c62828', boxShadow: 'none' },
            }}
          >
            <NotificationsActiveOutlinedIcon sx={{ fontSize: 22 }} />
            呼出
          </Button>
        )}
      </Box>

      {/* 中央：ステータス＋時刻 / 番号 / 人数 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', px: { xs: 1.5, md: 2 }, py: 1.25, gap: 0.25 }}>

        {/* 上行：バッジ（左）＋ 時刻（右） */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box
            sx={{
              bgcolor: badgeBg,
              color: badgeColor,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              px: 1,
              py: 0.25,
              borderRadius: 99,
              display: 'inline-block',
            }}
          >
            {badgeLabel}
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
            {timeStr}
          </Typography>
        </Box>

        {/* 整理券番号 */}
        <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', md: '2.4rem' }, color: '#111', lineHeight: 1.1 }}>
          {ticket.ticket_number}
        </Typography>

        {/* 人数 */}
        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
          人数 {ticket.party_size}
        </Typography>
      </Box>

      {/* 右：ボタン群（縦 1:2 比率） */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 0.75,
          px: { xs: 0.75, md: 1.5 },
          py: 1.25,
          borderLeft: '1px solid #e8e8e8',
          width: { xs: 108, md: 160 },
          flexShrink: 0,
        }}
      >
        {/* 保留行：「待ちに戻す」＋「完了」 */}
        {isOnHold && (
          <>
            <Button
              variant="outlined"
              disabled={isPending}
              startIcon={<UndoIcon fontSize="small" />}
              onClick={() => startTransition(async () => {
                try { await returnToWaiting(ticket.id, boothId) }
                catch { onError('操作に失敗しました。再度お試しください。') }
              })}
              sx={{
                color: '#666',
                borderColor: '#ccc',
                fontSize: { xs: '0.78rem', md: '0.85rem' },
                fontWeight: 'bold',
                width: '100%',
                height: 40,
                boxShadow: 'none',
                whiteSpace: 'nowrap',
                // モバイルではstartIconを非表示にして文字を収める
                '& .MuiButton-startIcon': { display: { xs: 'none', md: 'inline-flex' } },
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: '#999', boxShadow: 'none' },
              }}
            >
              待ちに戻す
            </Button>
            <Button
              variant="contained"
              disabled={isPending}
              onClick={() => setConfirmOpen(true)}
              sx={{
                bgcolor: GREEN_BTN,
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                width: '100%',
                height: 60,
                boxShadow: 'none',
                '&:hover': { bgcolor: GREEN_BTN_HOVER, boxShadow: 'none' },
              }}
            >
              完了
            </Button>
          </>
        )}

        {/* 待ち・呼出中：「保留」＋「完了」 */}
        {!isOnHold && (
          <>
            <Button
              variant="outlined"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                try { await holdTicket(ticket.id, boothId) }
                catch { onError('操作に失敗しました。再度お試しください。') }
              })}
              sx={{
                color: '#ef6c00',
                borderColor: '#ef6c00',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                width: '100%',
                height: 40,
                boxShadow: 'none',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#fff8e1', borderColor: '#e65100', boxShadow: 'none' },
              }}
            >
              保留
            </Button>
            <Button
              variant="contained"
              disabled={isPending}
              onClick={() => setConfirmOpen(true)}
              sx={{
                bgcolor: GREEN_BTN,
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                width: '100%',
                height: 60,
                boxShadow: 'none',
                '&:hover': { bgcolor: GREEN_BTN_HOVER, boxShadow: 'none' },
              }}
            >
              完了
            </Button>
          </>
        )}
      </Box>

      {/* 完了確認ダイアログ */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, px: 1, py: 0.5, minWidth: 320 },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <CheckCircleOutlineIcon sx={{ color: GREEN_BTN, fontSize: 28 }} />
          <Typography variant="h6" component="span" fontWeight="bold">完了にしますか？</Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 0, pb: 2 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '1.2rem' }}>
            整理券
            <Typography component="span" fontWeight="bold" sx={{ fontSize: '2rem', mx: 0.5, color: '#111' }}>
              {ticket.ticket_number}
            </Typography>
            番を完了にすると一覧から削除されます。
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '1rem', mt: 0.75 }}>
            この操作は取り消せません。
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            size='large'
            onClick={() => setConfirmOpen(false)}
            sx={{ flex: 1, borderColor: '#ccc', color: '#555', '&:hover': { borderColor: '#999', bgcolor: 'rgba(0,0,0,0.03)' } }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            size='large'
            disabled={isPending}
            onClick={() => {
              setConfirmOpen(false)
              startTransition(async () => {
                try { await completeTicket(ticket.id, boothId) }
                catch { onError('操作に失敗しました。再度お試しください。') }
              })
            }}
            sx={{ flex: 1, bgcolor: GREEN_BTN, boxShadow: 'none', fontWeight: 'bold', '&:hover': { bgcolor: GREEN_BTN_HOVER, boxShadow: 'none' } }}
          >
            完了
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}