import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { DesktopNotice } from "@/components/desktop-notice"
import { RotateGate } from "@/components/rotate-gate"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Aesthetic Whale — Statistiques des reports",
  description:
    "Statistiques de modération des reports du bot Discord Aesthetic Whale.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          {children}
          <DesktopNotice />
          <RotateGate />
        </ThemeProvider>
      </body>
    </html>
  )
}
