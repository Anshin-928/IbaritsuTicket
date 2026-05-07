// app/admin/booths/BoothCard.tsx
'use client'

import Link from 'next/link'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import type { Booth } from '@/types/database'

interface BoothCardProps {
  booth: Booth
}

export default function BoothCard({ booth }: BoothCardProps) {
  return (
    <Link href={`/booth/${booth.id}`} style={{ textDecoration: 'none' }}>
      <Card elevation={2} sx={{ height: '100%' }}>
        <CardActionArea sx={{ height: '100%', p: 1 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {booth.name}
                </Typography>
              </Box>
              <ArrowForwardIosIcon fontSize="small" color="action" />
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Link>
  )
}
