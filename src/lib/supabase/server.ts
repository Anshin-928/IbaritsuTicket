// src/lib/supabase/server.ts
// Server Component / Server Action で使う認証クライアント
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createAuthServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component からの呼び出し時は set できないが問題なし
          }
        },
      },
    }
  )
}
