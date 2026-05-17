import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatsClient from './StatsClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ booth_id: string }>
}

export default async function StatsPage({ params }: PageProps) {
  const { booth_id } = await params

  const [{ data: booth, error }, { data: tickets }] = await Promise.all([
    supabase.from('booths').select('id, name').eq('id', booth_id).single(),
    supabase
      .from('tickets')
      .select('*')
      .eq('booth_id', booth_id)
      .in('status', ['waiting', 'called', 'done', 'direct', 'on_hold'])
      .order('created_at', { ascending: true }),
  ])

  if (error || !booth) notFound()

  return <StatsClient tickets={tickets ?? []} />
}
