import fs from "node:fs"
import path from "node:path"

import { ThemeToggle } from "@/components/theme-toggle"

/**
 * The wordmark ships as two PNGs in `public/` — a dark one for the light theme
 * and a light one for the dark theme. Until both are committed the header falls
 * back to a text wordmark rather than a broken image.
 */
const LOGO_LIGHT = "/logo-light.png"
const LOGO_DARK = "/logo-dark.png"

function hasLogos() {
  const publicDir = path.join(process.cwd(), "public")
  return (
    fs.existsSync(path.join(publicDir, "logo-light.png")) &&
    fs.existsSync(path.join(publicDir, "logo-dark.png"))
  )
}

export function SiteHeader() {
  const logos = hasLogos()

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        {logos ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_LIGHT}
              alt="Aesthetic Stats"
              className="h-8 w-auto dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_DARK}
              alt="Aesthetic Stats"
              className="hidden h-8 w-auto dark:block"
            />
          </>
        ) : (
          <span className="font-heading text-base font-semibold tracking-tight">
            Aesthetic Stats
          </span>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
