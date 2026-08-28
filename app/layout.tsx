import type { Metadata } from 'next'
import { Bodoni_Moda, Work_Sans, JetBrains_Mono } from 'next/font/google'
import { PostHogProvider } from '@/components/analytics/PostHogProvider'
import './globals.css'

const bodoniModa = Bodoni_Moda({
  variable: '--font-bodoni-moda',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
})

const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: {
    default: "Afterglow — Is tonight's sky worth watching?",
    template: '%s | Afterglow',
  },
  description:
    'Afterglow predicts sunset quality using cloud, weather and atmospheric data. Get a 0–100 score, see why, and find out the best time and place to watch.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://afterglowapp.co.uk'),
  openGraph: {
    siteName: 'Afterglow',
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
    <html lang="en" className={`${bodoniModa.variable} ${workSans.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {/* AFTERGLOW DIRECTION CONTRACT · seed c8d3c766 · IMPECCABLE'S PICK
            THESIS: The page is a sky, not an interface. The score is a naturalist's
            notation over a living painted atmosphere; the card-grid hero shell is refused.
            OWN-WORLD: Drenched Turner palette — deep umber #0C0908 through crimson,
            amber #C8701A, gold #F0B830. Bodoni Moda italic display; Work Sans body;
            JetBrains Mono data. No cold blue anywhere.
            STORY: Visitor arrives mid-sky. Score is visible before a word is read.
            Scroll reveals timing and location.
            FIRST VIEWPORT: Full-viewport layered gradient sky. Score enormous in Bodoni
            Moda italic, floating at golden-horizon height. Location name in Work Sans
            small caps. Times in JetBrains Mono. No enclosing chrome on the score.
            FORM: JMW Turner's late atmospheric oil paintings — light as subject.
            FINISH: unreviewed and undocumented is unfinished; this build ends with
            the finish review, the verdict, DESIGN.md, and every shipping raster
            carrying its provenance. */}
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
