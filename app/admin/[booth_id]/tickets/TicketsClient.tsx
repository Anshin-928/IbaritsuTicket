// app/admin/[booth_id]/tickets/TicketsClient.tsx
'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { QRCodeCanvas } from 'qrcode.react'
import { prepareTickets } from './actions'
import type { TicketData } from './TicketPDFDocument'

// TicketPDFDocument.tsx の canvas サイズ定数と縦横比を一致させること
const BOOTH_CANVAS_W = 1200
const BOOTH_CANVAS_H = 144
const EVENT_CANVAS_W = 1200
const EVENT_CANVAS_H = 90

function renderTextCanvas(
  text: string,
  w: number,
  h: number,
  font: string,
  color: string,
): string {
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle    = color
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'

  // フォントサイズを自動縮小して幅に収める
  ctx.font = font
  let measured = ctx.measureText(text)
  if (measured.width > w * 0.95) {
    const match = font.match(/(\d+(?:\.\d+)?)px/)
    if (match) {
      let fontSize = parseFloat(match[1])
      while (measured.width > w * 0.95 && fontSize > 8) {
        fontSize -= 2
        ctx.font = font.replace(/(\d+(?:\.\d+)?)px/, `${fontSize}px`)
        measured = ctx.measureText(text)
      }
    }
  }

  ctx.fillText(text, w / 2, h / 2)
  return canvas.toDataURL('image/png')
}

// ステップ番号バッジ
function StepBadge({ n }: { n: number }) {
  return (
    <Box
      sx={{
        width: 24, height: 24, borderRadius: '50%',
        bgcolor: '#1E3A5F', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 'bold', flexShrink: 0,
      }}
    >
      {n}
    </Box>
  )
}

interface Props {
  boothId: string
}

export default function TicketsClient({ boothId }: Props) {
  const [from, setFrom] = useState('1')
  const [to, setTo] = useState('160')
  const eventName = 'いばらき ✕ 立命館DAY 2026'
  const [error, setError] = useState<string | null>(null)
  const [pdfReady, setPdfReady] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [boothName, setBoothName] = useState('')
  const [boothNameDataUrl, setBoothNameDataUrl] = useState('')
  const [eventNameDataUrl, setEventNameDataUrl] = useState('')
  const [rawTickets, setRawTickets] = useState<{ id: string; ticket_number: number }[]>([])
  const [ticketsWithQR, setTicketsWithQR] = useState<TicketData[]>([])
  const [isPending, startTransition] = useTransition()

  const canvasRefs = useRef(new Map<string, HTMLCanvasElement>())
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    if (rawTickets.length === 0) return

    const result: TicketData[] = rawTickets.map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      qrDataUrl: canvasRefs.current.get(t.id)?.toDataURL('image/png') ?? '',
    }))
    setTicketsWithQR(result)

    setBoothNameDataUrl(
      renderTextCanvas(
        boothName,
        BOOTH_CANVAS_W,
        BOOTH_CANVAS_H,
        `bold ${Math.round(BOOTH_CANVAS_H * 0.7)}px sans-serif`,
        '#444444',
      ),
    )
    setEventNameDataUrl(
      eventName
        ? renderTextCanvas(
            eventName,
            EVENT_CANVAS_W,
            EVENT_CANVAS_H,
            `${Math.round(EVENT_CANVAS_H * 0.65)}px sans-serif`,
            '#aaaaaa',
          )
        : '',
    )
    setPdfReady(true)
  }, [rawTickets, boothName, eventName])

  const handleGenerate = () => {
    setError(null)
    setPdfReady(false)
    setRawTickets([])
    setTicketsWithQR([])

    const fromNum = parseInt(from, 10)
    const toNum   = parseInt(to,   10)

    if (isNaN(fromNum) || isNaN(toNum) || fromNum < 1 || toNum < fromNum) {
      setError('有効な番号範囲を入力してください')
      return
    }
    if (toNum - fromNum >= 200) {
      setError('一度に生成できるのは最大200枚です')
      return
    }

    startTransition(async () => {
      const result = await prepareTickets(boothId, fromNum, toNum)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setBoothName(result.boothName)
      setRawTickets(result.tickets)
    })
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { pdf }                        = await import('@react-pdf/renderer')
      const { default: TicketPDFDocument } = await import('./TicketPDFDocument')
      const { createElement }              = await import('react')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(
        createElement(TicketPDFDocument, {
          eventNameDataUrl,
          boothNameDataUrl,
          tickets: ticketsWithQR,
        }) as any,
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = `tickets_${from}-${to}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setError('PDFの生成に失敗しました。')
    } finally {
      setDownloading(false)
    }
  }

  const count = (() => {
    const f = parseInt(from, 10)
    const t = parseInt(to,   10)
    return !isNaN(f) && !isNaN(t) && t >= f ? t - f + 1 : 0
  })()

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', width: '100%' }}>

      {/* ページヘッダー */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 0.5 }}>
          A4サイズ・4列×4行（1ページ16枚）面付け出力
        </Typography>
      </Box>

      {/* カード：設定 */}
      <Paper
        elevation={0}
        sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3, mb: 3 }}
      >
        {/* セクション① 番号範囲 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <StepBadge n={1} />
          <Typography fontWeight="bold" fontSize="0.95rem">
            整理券の番号範囲を指定
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="開始番号"
            type="number"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPdfReady(false) }}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ width: 130 }}
            size="small"
          />
          <Typography color="text.secondary" sx={{ fontSize: '1.2rem' }}>〜</Typography>
          <TextField
            label="終了番号"
            type="number"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPdfReady(false) }}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ width: 130 }}
            size="small"
          />
          {count > 0 && (
            <Chip
              label={`${count} 枚`}
              size="small"
              sx={{ bgcolor: '#e8f0fb', color: '#1E3A5F', fontWeight: 'bold', fontSize: '0.85rem' }}
            />
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 生成ボタン */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={isPending || count === 0}
        onClick={handleGenerate}
        startIcon={
          isPending
            ? <CircularProgress size={18} sx={{ color: '#fff' }} />
            : <PictureAsPdfOutlinedIcon />
        }
        sx={{
          py: 1.5,
          fontSize: '1rem',
          fontWeight: 'bold',
          boxShadow: 'none',
          mb: 3,
          '&:hover': { boxShadow: 'none' },
        }}
      >
        {isPending ? 'QRコード生成中...' : 'QRコードを生成する'}
      </Button>

      {/* 結果カード */}
      {pdfReady && ticketsWithQR.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #c8e6c9',
            borderRadius: 2,
            p: 3,
            bgcolor: '#f9fef9',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <CheckCircleOutlineIcon sx={{ color: '#388e3c', fontSize: 28 }} />
            <Box>
              <Typography fontWeight="bold" sx={{ color: '#2e7d32' }}>
                準備完了
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                {ticketsWithQR.length}枚分のQRコードを生成しました
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={downloading}
            onClick={handleDownload}
            startIcon={
              downloading
                ? <CircularProgress size={18} sx={{ color: '#fff' }} />
                : <DownloadOutlinedIcon />
            }
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 'bold',
              bgcolor: '#388e3c',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#2e7d32', boxShadow: 'none' },
            }}
          >
            {downloading
              ? 'PDF生成中...'
              : `PDFをダウンロード（${ticketsWithQR.length}枚）`}
          </Button>
        </Paper>
      )}

      {/* 非表示 QR canvas 群（data URL 取得用） */}
      <Box sx={{ position: 'absolute', left: -9999, top: -9999, visibility: 'hidden' }}>
        {rawTickets.map((t) => (
          <QRCodeCanvas
            key={t.id}
            value={`${origin}/ticket/${t.id}`}
            size={200}
            ref={(el: HTMLCanvasElement | null) => {
              if (el) canvasRefs.current.set(t.id, el)
              else canvasRefs.current.delete(t.id)
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
