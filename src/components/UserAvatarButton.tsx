'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import { createAuthClient } from '@/lib/supabase/client'

interface UserAvatarButtonProps {
  /** アバタークリック時の遷移先。デフォルト: '/admin/account' */
  accountPath?: string
}

export default function UserAvatarButton({ accountPath = '/admin/account' }: UserAvatarButtonProps) {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl]     = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>('')

  useEffect(() => {
    const supabase = createAuthClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setAvatarUrl(user.user_metadata?.avatar_url ?? null)
      setDisplayName(user.user_metadata?.full_name ?? user.email ?? '')
    })

    // アバター更新時にリアルタイムで反映
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user
      if (!user) return
      setAvatarUrl(user.user_metadata?.avatar_url ?? null)
      setDisplayName(user.user_metadata?.full_name ?? user.email ?? '')
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <Tooltip title={displayName || 'マイアカウント'} placement="bottom-end">
      <IconButton
        onClick={() => router.push(accountPath)}
        sx={{ p: 0.5, flexShrink: 0 }}
      >
        <Avatar
          src={avatarUrl ?? undefined}
          alt={displayName}
          sx={{ width: 42, height: 42, bgcolor: avatarUrl ? 'transparent' : '#c0392b' }}
        >
          {!avatarUrl && <PersonOutlinedIcon sx={{ fontSize: 20 }} />}
        </Avatar>
      </IconButton>
    </Tooltip>
  )
}
