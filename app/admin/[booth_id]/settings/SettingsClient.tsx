'use client'

import { useState, useTransition } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { updateBoothName, resetEvent, deleteBoothById } from './actions'
import type { Booth } from '@/types/database'

interface Props {
  booth: Booth
}

export default function SettingsClient({ booth }: Props) {
  const [boothName, setBoothName] = useState(booth.name)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [namePending, startNameTransition] = useTransition()

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetInput, setResetInput] = useState('')
  const [resetResult, setResetResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [resetPending, startResetTransition] = useTransition()

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePending, startDeleteTransition] = useTransition()

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteBoothById(booth.id)
      } catch {
        setDeleteError('ブースの削除に失敗しました')
      }
    })
  }

  const handleNameSave = () => {
    setNameMsg(null)
    startNameTransition(async () => {
      const res = await updateBoothName(booth.id, boothName)
      setNameMsg(res.ok ? { ok: true, text: 'ブース名を更新しました' } : { ok: false, text: res.error })
    })
  }

  const handleReset = () => {
    startResetTransition(async () => {
      const res = await resetEvent(booth.id)
      setResetConfirmOpen(false)
      setResetInput('')
      setResetResult(
        res.ok
          ? { ok: true, text: `${res.deletedCount}件のチケットを削除しました` }
          : { ok: false, text: res.error },
      )
    })
  }

  const CONFIRM_WORD = 'リセット'
  const canReset = resetInput === CONFIRM_WORD

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── ブース設定 ── */}
      <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
          <EditOutlinedIcon sx={{ color: 'text.secondary' }} />
          <Typography fontWeight="bold" fontSize="1rem">ブース設定</Typography>
        </Box>

        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>ブース名</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            value={boothName}
            onChange={(e) => { setBoothName(e.target.value); setNameMsg(null) }}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          <Button
            variant="contained"
            disabled={namePending || boothName.trim() === booth.name}
            onClick={handleNameSave}
            sx={{ whiteSpace: 'nowrap', boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {namePending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : '保存'}
          </Button>
        </Box>

        {nameMsg && (
          <Alert
            severity={nameMsg.ok ? 'success' : 'error'}
            icon={nameMsg.ok ? <CheckCircleOutlineIcon fontSize="small" /> : undefined}
            sx={{ mt: 1.5 }}
          >
            {nameMsg.text}
          </Alert>
        )}
      </Paper>

      {/* ── チケット全削除 ── */}
      <Paper
        elevation={0}
        sx={{ border: '1.5px solid #e53935', borderRadius: 2, p: 3, bgcolor: '#fffafa' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WarningAmberIcon sx={{ color: '#e53935' }} />
          <Typography fontWeight="bold" fontSize="1rem" color="#c62828">チケット全削除</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 2.5, lineHeight: 1.7 }}>
          <strong>{booth.name}</strong> のチケットをすべて削除します。開始前・テスト後のリセットに使用してください。<br />
          ブース自体は残ります。また、他のブースには影響しません。<br />
          <strong>この操作は取り消せません。</strong>
        </Typography>

        {resetResult && (
          <Alert severity={resetResult.ok ? 'success' : 'error'} sx={{ mb: 2 }}>
            {resetResult.text}
          </Alert>
        )}

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverOutlinedIcon />}
          onClick={() => { setResetConfirmOpen(true); setResetInput('') }}
          sx={{ fontWeight: 'bold' }}
        >
          チケットをすべて削除する
        </Button>
      </Paper>

      {/* ── ブース削除 ── */}
      <Paper
        elevation={0}
        sx={{ border: '1.5px solid #b71c1c', borderRadius: 2, p: 3, bgcolor: '#fff5f5' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <WarningAmberIcon sx={{ color: '#b71c1c' }} />
          <Typography fontWeight="bold" fontSize="1rem" color="#b71c1c">このブースを削除</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 2.5, lineHeight: 1.7 }}>
          <strong>{booth.name}</strong> と全チケットを削除します。他のブースには影響しません。<br />
          <strong>この操作は取り消せません。</strong>
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverOutlinedIcon />}
          onClick={() => { setDeleteInput(''); setDeleteError(null); setDeleteConfirmOpen(true) }}
          sx={{ fontWeight: 'bold' }}
        >
          このブースを削除する
        </Button>
      </Paper>

      {/* ブース削除確認ダイアログ */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !deletePending && setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, px: 1, py: 0.5, minWidth: 340 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <WarningAmberIcon sx={{ color: '#b71c1c', fontSize: 28 }} />
          <Typography variant="h6" component="span" fontWeight="bold">ブースを削除しますか？</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 0, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.7 }}>
            <strong>{booth.name}</strong> と全チケットが削除されます。この操作は取り消せません。
          </Typography>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 0.75 }}>
              確認のため <strong>「{booth.name}」</strong> と入力してください
            </Typography>
            <TextField
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              size="small"
              fullWidth
              placeholder={booth.name}
              autoComplete="off"
            />
          </Box>
          {deleteError && <Alert severity="error">{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            size="large"
            disabled={deletePending}
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ flex: 1, borderColor: '#ccc', color: '#555' }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            size="large"
            disabled={deleteInput !== booth.name || deletePending}
            onClick={handleDelete}
            sx={{ flex: 1, fontWeight: 'bold', boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {deletePending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : '削除する'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* チケット全削除確認ダイアログ */}
      <Dialog
        open={resetConfirmOpen}
        onClose={() => !resetPending && setResetConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, px: 1, py: 0.5, minWidth: 340 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <WarningAmberIcon sx={{ color: '#e53935', fontSize: 28 }} />
          <Typography variant="h6" component="span" fontWeight="bold">チケットをすべて削除しますか？</Typography>
        </DialogTitle>

        <DialogContent sx={{ pt: 0, pb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', lineHeight: 1.7 }}>
            <strong>{booth.name}</strong> のチケットがすべて削除されます。<br />
            ブース自体と他のブースには影響しません。この操作は取り消せません。
          </Typography>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 0.75 }}>
              確認のため <strong>「{CONFIRM_WORD}」</strong> と入力してください
            </Typography>
            <TextField
              value={resetInput}
              onChange={(e) => setResetInput(e.target.value)}
              size="small"
              fullWidth
              placeholder={CONFIRM_WORD}
              autoComplete="off"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            size="large"
            disabled={resetPending}
            onClick={() => setResetConfirmOpen(false)}
            sx={{ flex: 1, borderColor: '#ccc', color: '#555' }}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            size="large"
            disabled={!canReset || resetPending}
            onClick={handleReset}
            sx={{ flex: 1, fontWeight: 'bold', boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {resetPending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : '削除する'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
