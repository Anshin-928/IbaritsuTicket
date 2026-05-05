// src/lib/supabase/client.ts
// ブラウザ側（Client Component）で使う認証クライアント
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createAuthClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
