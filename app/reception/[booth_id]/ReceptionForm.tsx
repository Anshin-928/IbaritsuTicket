// app/reception/[booth_id]/ReceptionForm.tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'
import type { Booth } from '@/types/database'
import { submitReception, type ReceptionResult } from './actions'

const AUTO_RESET_MS = 6000

interface ReceptionFormProps {
  booth: Booth
}

export default function ReceptionForm({ booth }: ReceptionFormProps) {
  const [partySize, setPartySize] = useState<number>(1)
  const [result, setResult] = useState<ReceptionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  // 一定時間後に自動リセット
  useEffect(() => {
    if (!result) return
    const timer = setTimeout(() => setResult(null), AUTO_RESET_MS)
    return () => clearTimeout(timer)
  }, [result])

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitReception(booth.id, partySize)
      setResult(res)
      if (res.type !== 'error') {
        setPartySize(1)
      }
    })
  }

  if (result) {
    return <ResultScreen result={result} />
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        px: 3,
        py: 6,
        bgcolor: 'background.default',
      }}
    >
      <Typography variant="h3" fontWeight="bold" textAlign="center">
        {booth.name}
      </Typography>

      <Typography variant="h5" color="text.secondary" textAlign="center">
        何名様でお越しですか？
      </Typography>

      <ToggleButtonGroup
        value={partySize}
        exclusive
        onChange={(_, val) => val !== null && setPartySize(val)}
        sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: 1, maxWidth: 480 }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <ToggleButton
            key={n}
            value={n}
            sx={{ width: 80, height: 80, fontSize: '1.5rem', fontWeight: 'bold' }}
          >
            {n}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Typography variant="body1" color="text.secondary">
        選択中: <strong>{partySize} 名</strong>
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={isPending}
        startIcon={
          isPending ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            <ConfirmationNumberIcon />
          )
        }
        sx={{ fontSize: '1.4rem', px: 6, py: 2, borderRadius: 3 }}
      >
        {isPending ? '処理中...' : '受付する'}
      </Button>
    </Box>
  )
}

function ResultScreen({ result }: { result: ReceptionResult }) {
  if (result.type === 'issued') {
    return (
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          px: 3,
          bgcolor: 'primary.light',
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 100, color: 'primary.dark' }} />
        <Typography variant="h3" fontWeight="bold" textAlign="center" color="primary.dark">
          受付完了！
        </Typography>
        <Typography variant="h5" textAlign="center" color="primary.dark">
          スタッフから
        </Typography>
        <Typography
          variant="h2"
          fontWeight="bold"
          textAlign="center"
          color="primary.dark"
          sx={{
            border: '4px solid',
            borderColor: 'primary.dark',
            borderRadius: 3,
            px: 5,
            py: 2,
          }}
        >
          【 {result.ticketNumber} 番 】
        </Typography>
        <Typography variant="h5" textAlign="center" color="primary.dark">
          の整理券をお受け取りください
        </Typography>
        <Typography variant="body1" color="primary.dark" sx={{ opacity: 0.7 }}>
          しばらくしますと自動的に戻ります
        </Typography>
      </Box>
    )
  }

  // error
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        px: 3,
        bgcolor: 'error.light',
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 100, color: 'error.dark' }} />
      <Typography
        variant="h4"
        fontWeight="bold"
        textAlign="center"
        color="error.dark"
        whiteSpace="pre-line"
      >
        {result.message}
      </Typography>
      <Typography variant="body1" color="error.dark" sx={{ opacity: 0.7 }}>
        しばらくしますと自動的に戻ります
      </Typography>
    </Box>
  )
}
