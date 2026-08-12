import Image from "next/image"

import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Two files in `public/`: the dark wordmark for the light theme, the light one
 * for the dark theme. Swapped with the `dark:` variant so no client-side mount
 * flag is needed.
 */
const LOGO_WIDTH = 961
const LOGO_HEIGHT = 407

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 md:px-6">
        <Image
          src="/logo-light.png"
          alt="Aesthetic Stats"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          priority
          className="h-11 w-auto md:h-12 dark:hidden"
        />
        <Image
          src="/logo-dark.png"
          alt="Aesthetic Stats"
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          priority
          className="hidden h-11 w-auto md:h-12 dark:block"
        />
        <ThemeToggle />
      </div>
    </header>
  )
}
