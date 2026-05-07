// app/admin/(home)/page.tsx
import { supabase } from '@/lib/supabase'
import HomeContent from './HomeContent'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [{ data: booths, error }, { data: activeTickets }, { data: doneTickets }] = await Promise.all([
    supabase.from('booths').select('*').order('name'),
    supabase.from('tickets').select('booth_id,status,party_size').in('status', ['waiting', 'called', 'on_hold']),
    supabase.from('tickets').select('booth_id,party_size').eq('status', 'done').gte('updated_at', todayStart.toISOString()),
  ])

  const ticketSummaries = [
    ...(activeTickets ?? []),
    ...(doneTickets ?? []).map(t => ({ ...t, status: 'done' as const })),
  ]

  return (
    <HomeContent
      booths={booths ?? []}
      ticketSummaries={ticketSummaries}
      fetchError={error?.message}
    />
  )
}
