// app/admin/[booth_id]/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createAuthServerClient } from '@/lib/supabase/server'

function revalidate(boothId: string) {
  revalidatePath(`/admin/${boothId}/dashboard`)
}

/** 特定のチケットを called にする（waiting / on_hold どちらからでも可） */
export async function callSpecificTicket(ticketId: string, boothId: string) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'called', updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('booth_id', boothId)

  if (error) throw new Error(error.message)
  revalidate(boothId)
}

/** called チケットを done にする */
export async function completeTicket(ticketId: string, boothId: string) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('booth_id', boothId)

  if (error) throw new Error(error.message)
  revalidate(boothId)
}

/** called チケットを waiting に戻す */
export async function returnToWaiting(ticketId: string, boothId: string) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'waiting', updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('booth_id', boothId)

  if (error) throw new Error(error.message)
  revalidate(boothId)
}

/** waiting / called チケットを on_hold にする */
export async function holdTicket(ticketId: string, boothId: string) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'on_hold', updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('booth_id', boothId)

  if (error) throw new Error(error.message)
  revalidate(boothId)
}
