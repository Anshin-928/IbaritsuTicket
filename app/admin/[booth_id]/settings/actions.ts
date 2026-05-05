'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'

export async function updateBoothName(
  boothId: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '認証が必要です' }

  const trimmed = name.trim()
  if (!trimmed) return { ok: false, error: 'ブース名を入力してください' }
  if (trimmed.length > 50) return { ok: false, error: 'ブース名は50文字以内にしてください' }

  const { error } = await supabase
    .from('booths')
    .update({ name: trimmed })
    .eq('id', boothId)

  if (error) return { ok: false, error: 'ブース名の更新に失敗しました' }

  revalidatePath(`/admin/${boothId}/settings`)
  revalidatePath(`/admin/${boothId}`)
  return { ok: true }
}

export async function resetEvent(
  boothId: string,
): Promise<{ ok: true; deletedCount: number } | { ok: false; error: string }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '認証が必要です' }

  const { count, error } = await supabase
    .from('tickets')
    .delete({ count: 'exact' })
    .eq('booth_id', boothId)

  if (error) return { ok: false, error: '初期化に失敗しました' }

  // ブースのステータスを empty にリセット
  await supabase.from('booths').update({ status: 'empty' }).eq('id', boothId)

  revalidatePath(`/admin/${boothId}/dashboard`)
  return { ok: true, deletedCount: count ?? 0 }
}

export async function deleteBoothById(boothId: string): Promise<void> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 関連チケットを先に削除
  await supabase.from('tickets').delete().eq('booth_id', boothId)

  const { error } = await supabase.from('booths').delete().eq('id', boothId)
  if (error) throw new Error('ブースの削除に失敗しました')

  redirect('/admin')
}
