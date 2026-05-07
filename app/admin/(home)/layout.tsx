// app/admin/(home)/layout.tsx
import { supabase } from '@/lib/supabase'
import AdminHomeClient from '../AdminHomeClient'

export const dynamic = 'force-dynamic'

export default async function AdminHomeGroupLayout({ children }: { children: React.ReactNode }) {
  const { data: booths } = await supabase.from('booths').select('*').order('name')
  return (
    <AdminHomeClient booths={booths ?? []}>
      {children}
    </AdminHomeClient>
  )
}
