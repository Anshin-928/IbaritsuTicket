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

  // unissued（QR印刷済み）チケットを優先して使う
  const { data: unissuedTicket } = await supabase
    .from('tickets')
    .select('id, ticket_number')
    .eq('booth_id', boothId)
    .eq('status', 'unissued')
    .order('ticket_number', { ascending: true })
    .limit(1)
    .single()

  if (unissuedTicket) {
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'waiting',
        party_size: partySize,
        updated_at: new Date().toISOString(),
      })
      .eq('id', unissuedTicket.id)

    if (error) return { type: 'error', message: '発券処理に失敗しました。' }

    revalidatePath(`/admin/${boothId}`)
    revalidatePath(`/admin/${boothId}/checkin`)
    return { type: 'issued', ticketNumber: unissuedTicket.ticket_number }
  }

  // unissued がない場合は番号を採番して新規 waiting を作成
  // （後でPDF生成した際にこの番号のQRが自動的に紐づく）
  const { data: maxRow } = await supabase
    .from('tickets')
    .select('ticket_number')
    .eq('booth_id', boothId)
    .order('ticket_number', { ascending: false })
    .limit(1)
    .single()

  const nextNumber = maxRow ? maxRow.ticket_number + 1 : 1

  const { error } = await supabase.from('tickets').insert({
    booth_id: boothId,
    ticket_number: nextNumber,
    party_size: partySize,
    status: 'waiting',
  })

  if (error) return { type: 'error', message: '発券処理に失敗しました。' }

  revalidatePath(`/admin/${boothId}`)
  revalidatePath(`/admin/${boothId}/checkin`)
  return { type: 'issued', ticketNumber: nextNumber }
}
