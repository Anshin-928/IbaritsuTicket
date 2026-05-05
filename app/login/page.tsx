// app/login/page.tsx
// /login へのアクセスはルートのログインページへ転送
import { redirect } from 'next/navigation'

export default function LoginRedirect() {
  redirect('/')
}
