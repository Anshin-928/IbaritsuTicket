// app/admin/[booth_id]/checkin/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createAuthServerClient } from '@/lib/supabase/server'

export type IssueResult =
  | { type: 'issued'; ticketNumber: number }
  | { type: 'error'; message: string }

export async function issueTicket(boothId: string, partySize: number): Promise<IssueResult> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { type: 'error', message: '認証が必要です。' }

  // PostgreSQL 関数でアトミックに発券（TOCTOU 競合なし）
  // unissued チケット優先、なければ連番で新規作成
  const { data, error } = await supabase.rpc('issue_ticket_admin', {
    p_booth_id: boothId,
    p_party_size: partySize,
  })

  if (error) return { type: 'error', message: '発券処理に失敗しました。' }
  if (!data || data.length === 0) {
    return { type: 'error', message: '発券処理に失敗しました。' }
  }

  revalidatePath(`/admin/${boothId}`)
  revalidatePath(`/admin/${boothId}/checkin`)
  return { type: 'issued', ticketNumber: data[0].ticket_number }
}
