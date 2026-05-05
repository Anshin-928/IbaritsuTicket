// app/admin/[booth_id]/tickets/actions.ts
'use server'

import { createAuthServerClient } from '@/lib/supabase/server'

export type PrepareTicketsResult =
  | { ok: true; boothName: string; tickets: { id: string; ticket_number: number }[] }
  | { ok: false; error: string }

export async function prepareTickets(
  boothId: string,
  from: number,
  to: number,
): Promise<PrepareTicketsResult> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '認証が必要です' }

  if (from < 1 || to < from || to - from >= 200) {
    return { ok: false, error: '番号の範囲が不正です（最大200枚まで）' }
  }

  const { data: booth } = await supabase
    .from('booths')
    .select('name')
    .eq('id', boothId)
    .single()

  if (!booth) return { ok: false, error: 'ブースが見つかりません' }

  // 範囲内の既存チケットを取得
  const { data: existing } = await supabase
    .from('tickets')
    .select('id, ticket_number')
    .eq('booth_id', boothId)
    .gte('ticket_number', from)
    .lte('ticket_number', to)

  const existingMap = new Map((existing ?? []).map((t) => [t.ticket_number, t.id]))

  const result: { id: string; ticket_number: number }[] = []
  const toInsert: {
    booth_id: string
    ticket_number: number
    party_size: number
    status: 'unissued'
  }[] = []

  for (let n = from; n <= to; n++) {
    const existingId = existingMap.get(n)
    if (existingId) {
      result.push({ id: existingId, ticket_number: n })
    } else {
      toInsert.push({ booth_id: boothId, ticket_number: n, party_size: 0, status: 'unissued' })
    }
  }

  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from('tickets')
      .insert(toInsert)
      .select('id, ticket_number')

    if (error || !inserted) return { ok: false, error: 'チケットの作成に失敗しました' }

    for (const t of inserted) {
      result.push({ id: t.id, ticket_number: t.ticket_number })
    }
  }

  result.sort((a, b) => a.ticket_number - b.ticket_number)

  return { ok: true, boothName: booth.name, tickets: result }
}
