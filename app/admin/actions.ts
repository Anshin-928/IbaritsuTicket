// app/admin/actions.ts
'use server'

import { createAuthServerClient } from '@/lib/supabase/server'

export async function createBooth(name: string): Promise<{ id: string }> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('booths')
    .insert({ name, status: 'empty', capacity: 0 })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data
}

