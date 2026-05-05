// app/admin/booths/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createAuthServerClient } from '@/lib/supabase/server'
import type { BoothStatus } from '@/types/database'

export async function toggleBoothStatus(boothId: string, currentStatus: BoothStatus) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const newStatus: BoothStatus = currentStatus === 'empty' ? 'crowded' : 'empty'

  const { error } = await supabase
    .from('booths')
    .update({ status: newStatus })
    .eq('id', boothId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/booths')
}

export async function callNextTicket(boothId: string) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. 現在 'called' のチケットを 'done' に更新
  const { error: doneError } = await supabase
    .from('tickets')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('booth_id', boothId)
    .eq('status', 'called')

  if (doneError) throw new Error(doneError.message)

  // 2. 最も古い 'waiting' のチケットを 'called' に更新
  const { data: nextTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('id')
    .eq('booth_id', boothId)
    .eq('status', 'waiting')
    .order('updated_at', { ascending: true })
    .limit(1)
    .single()

  if (fetchError) {
    // waiting チケットがない場合は正常終了
    if (fetchError.code === 'PGRST116') {
      revalidatePath('/admin/booths')
      return
    }
    throw new Error(fetchError.message)
  }

  const { error: callError } = await supabase
    .from('tickets')
    .update({ status: 'called', updated_at: new Date().toISOString() })
    .eq('id', nextTicket.id)

  if (callError) throw new Error(callError.message)

  revalidatePath('/admin/booths')
}
