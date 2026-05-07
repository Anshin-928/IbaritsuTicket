// app/admin/(home)/account/page.tsx
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import AccountClient from '../../account/AccountClient'

export default async function AccountPage() {
  const authClient = await createAuthServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect('/')

  return <AccountClient />
}
