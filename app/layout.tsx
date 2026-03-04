import './styles/shared.css'
import type { Metadata } from 'next'
import NavBar from './components/NavBar'

export const metadata: Metadata = {
  title: 'Naija FC Sheffield',
  description: '7-a-side league — live scores, table, fixtures and stats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#080f08' }}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}