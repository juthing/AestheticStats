"use client"

import * as React from "react"
import Image from "next/image"

import { ThemeToggle } from "@/components/theme-toggle"
import { PHONE_QUERY, useMediaQuery } from "@/lib/phone-mode"
import { cn } from "@/lib/utils"

/**
 * Two files in `public/`: the dark wordmark for the light theme, the light one
 * for the dark theme. Swapped with the `dark:` variant so no client-side mount
 * flag is needed.
 */
const LOGO_WIDTH = 961
const LOGO_HEIGHT = 407

/**
 * Hides on scroll down, reappears on scroll up — phones only, where the
 * sticky header eats into an already small viewport. A dead zone near the
 * top and a small delta threshold keep it still during the rubber-band
 * bounce and tiny jitters.
 */
function useAutoHide(enabled: boolean) {
  const [hidden, setHidden] = React.useState(false)
  const lastY = React.useRef(0)

  React.useEffect(() => {
    if (!enabled) {
      setHidden(false)
      return
    }

    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current
      if (y < 32) setHidden(false)
      else if (delta > 8) setHidden(true)
      else if (delta < -8) setHidden(false)
      lastY.current = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [enabled])

  return hidden
}

export function SiteHeader() {
  const isPhone = useMediaQuery(PHONE_QUERY)
  const hidden = useAutoHide(isPhone)

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl transition-transform duration-300 supports-[backdrop-filter]:bg-background/60",
        hidden && "-translate-y-full"
      )}
    >
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
