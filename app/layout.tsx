import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "RENMIP - Red Nacional de Técnicos, Sub Oficiales y Licenciados Militares y de Policías",
  description: "Red Nacional de Técnicos, Sub Oficiales y Licenciados Militares y de Policías que defendieron la Democracia entre 1980 - 1997",
  generator: "Jorge",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
