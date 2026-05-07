// app/reception/[booth_id]/actions.ts
'use server'

import { supabase } from '@/lib/supabase'

export type ReceptionResult =
  | { type: 'issued'; ticketNumber: number }
  | { type: 'error'; message: string }

export async function submitReception(
  boothId: string,
  partySize: number
): Promise<ReceptionResult> {
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 10) {
    return { type: 'error', message: '人数の入力が不正です。' }
  }

  // 最小 ticket_number の unissued チケットを waiting に更新
  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select('id, ticket_number')
    .eq('booth_id', boothId)
    .eq('status', 'unissued')
    .order('ticket_number', { ascending: true })
    .limit(1)
    .single()

  if (fetchError || !ticket) {
    return { type: 'error', message: '現在受付を停止しています。\nスタッフにお声がけください。' }
  }

  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'waiting',
      party_size: partySize,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticket.id)

  if (updateError) return { type: 'error', message: '受付処理に失敗しました。' }

  return { type: 'issued', ticketNumber: ticket.ticket_number }
}
