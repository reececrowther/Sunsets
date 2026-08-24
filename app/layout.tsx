import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces } from 'next/font/google'
import { PostHogProvider } from '@/components/analytics/PostHogProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: {
    default: "SunsetScore — Will tonight's sunset be worth seeing?",
    template: '%s | SunsetScore',
  },
  description:
    'SunsetScore predicts sunset quality using cloud, weather and atmospheric data. Get a 0–100 score, see why, and find out the best time and place to watch.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sunsetscore.com'),
  openGraph: {
    siteName: 'SunsetScore',
    type: 'website',
    locale: 'en_GB',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
