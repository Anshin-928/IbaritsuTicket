// app/admin/[booth_id]/account/page.tsx
// app/admin/[booth_id]/layout.tsx が自動で BoothAdminLayout（青サイドバー）を適用する
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import AccountClient from '../../account/AccountClient'

export default async function BoothAccountPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return <AccountClient />
}
