// app/admin/[booth_id]/checkin/CheckinForm.tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import type { Booth } from '@/types/database'
import { issueTicket, type IssueResult } from './actions'

const AUTO_RESET_MS = 5000

interface CheckinFormProps {
  booth: Booth
}

export default function CheckinForm({ booth }: CheckinFormProps) {
  const [partySize, setPartySize] = useState<number>(1)
  const [result, setResult] = useState<IssueResult | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!result || result.type === 'error') return
    const timer = setTimeout(() => setResult(null), AUTO_RESET_MS)
    return () => clearTimeout(timer)
  }, [result])

  const handleIssue = () => {
    startTransition(async () => {
      const res = await issueTicket(booth.id, partySize)
      setResult(res)
      if (res.type !== 'error') setPartySize(1)
    })
  }

  return (
    <Box sx={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 4 }}>

      <Divider />

      <Box>
        <Typography variant="subtitle1" fontWeight="bold" mb={1.5}>
          人数選択
        </Typography>
        <ToggleButtonGroup
          value={partySize}
          exclusive
          onChange={(_, val) => val !== null && setPartySize(val)}
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <ToggleButton
              key={n}
              value={n}
              sx={{ width: 64, height: 64, fontSize: '1.25rem', fontWeight: 'bold' }}
            >
              {n}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" mt={1}>
          選択中: <strong>{partySize} 名</strong>
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        onClick={handleIssue}
        disabled={isPending}
        startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : <ConfirmationNumberIcon />}
        sx={{ py: 1.5, fontSize: '1rem', borderRadius: 2, alignSelf: 'flex-start', px: 4 }}
      >
        {isPending ? '処理中...' : '発券する'}
      </Button>

      {result && (
        <ResultAlert result={result} onClose={() => setResult(null)} />
      )}
    </Box>
  )
}

function ResultAlert({ result, onClose }: { result: IssueResult; onClose: () => void }) {
  if (result.type === 'issued') {
    return (
      <Alert
        severity="success"
        icon={<CheckCircleOutlineIcon />}
        onClose={onClose}
        sx={{ fontSize: '1rem' }}
      >
        発券しました。&nbsp;
        <Typography component="span" fontWeight="bold" fontSize="1.2rem">
          {result.ticketNumber} 番
        </Typography>
        &nbsp;の整理券をお渡しください。
      </Alert>
    )
  }

  return (
    <Alert severity="error" onClose={onClose} sx={{ whiteSpace: 'pre-line' }}>
      {result.message}
    </Alert>
  )
}
