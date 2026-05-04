import type { Metadata } from 'next'

export const metadata: Metadata = {
  themeColor: '#f5f4f1',
}

export default function TicketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`html, body { background-color: #f5f4f1; }`}</style>
      {children}
    </>
  )
}
