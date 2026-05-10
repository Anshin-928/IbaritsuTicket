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

  // PostgreSQL 関数でアトミックに発券（TOCTOU 競合なし）
  const { data, error } = await supabase.rpc('issue_next_ticket', {
    p_booth_id: boothId,
    p_party_size: partySize,
  })

  if (error) return { type: 'error', message: '受付処理に失敗しました。' }

  // 空配列 = unissued チケットなし
  if (!data || data.length === 0) {
    return { type: 'error', message: '現在受付を停止しています。\nスタッフにお声がけください。' }
  }

  return { type: 'issued', ticketNumber: data[0].ticket_number }
}
