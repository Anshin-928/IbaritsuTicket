// app/page.tsx
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase/server'
import LoginPageClient from './LoginPageClient'

export default async function Home() {
  // ログイン済みなら管理画面へ
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/admin')

  return <LoginPageClient />
}
