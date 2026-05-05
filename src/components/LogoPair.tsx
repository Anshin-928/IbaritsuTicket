// src/components/LogoPair.tsx
// logo.svg（左）と logo-oic.png（右）を常に同じ高さで横並びに表示するコンポーネント
import Box from '@mui/material/Box'

interface LogoPairProps {
  /** 両ロゴの高さ（px）。デフォルト 36 */
  height?: number
}

export default function LogoPair({ height = 36 }: LogoPairProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* 左：logo.svg */}
      <Box
        component="img"
        src="/logo.svg"
        alt="ロゴ"
        sx={{ height, width: 'auto', display: 'block' }}
      />
      {/* 右：logo-oic.png */}
      <Box
        component="img"
        src="/logo-oic.png"
        alt="OIC ロゴ"
        sx={{ height, width: 'auto', display: 'block' }}
      />
    </Box>
  )
}
