import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'POAP Infrastructure - Organizer Dashboard',
  description: 'Multi-tenant gasless POAP platform on Solana - Organizer Dashboard',
  keywords: ['POAP', 'Solana', 'NFT', 'Gasless', 'Blockchain', 'Events'],
  authors: [{ name: 'POAP Infrastructure Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#6366f1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}