// app/admin/account/page.tsx
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/supabase'
import AdminHomeClient from '../AdminHomeClient'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const authClient = await createAuthServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/')

  const { data: booths } = await supabase.from('booths').select('*').order('name')

  return (
    <AdminHomeClient
      booths={booths ?? []}
      pageTitle="マイアカウント"
      showBackButton
    >
      <AccountClient />
    </AdminHomeClient>
  )
}
