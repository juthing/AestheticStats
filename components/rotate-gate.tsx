"use client"

import * as React from "react"
import { Monitor, RotateCw } from "lucide-react"

import {
  PHONE_QUERY,
  PORTRAIT_QUERY,
  releaseLandscapeLock,
  tryLockLandscape,
  useMediaQuery,
} from "@/lib/phone-mode"

/**
 * A phone held upright gets the page withheld rather than a cramped version of
 * it: several charts carry dozens of categories and are unreadable at 390px.
 * The gate lifts by itself the moment the device reports landscape — on its
 * own if the browser grants the lock below, by hand otherwise.
 *
 * Screen size decides, not the user agent — sniffing for an iPhone would miss
 * every other phone and misfire on desktop browsers pretending to be one.
 */
export function RotateGate() {
  const isPhone = useMediaQuery(PHONE_QUERY)
  const isPortrait = useMediaQuery(PORTRAIT_QUERY)
  const gateUp = isPhone && isPortrait

  React.useEffect(() => {
    if (!gateUp) return
    void tryLockLandscape()
    return () => releaseLandscapeLock()
  }, [gateUp])

  if (!gateUp) return null

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-background px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <RotateCw className="size-7" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Tourne ton téléphone
        </h2>
        <p className="text-sm text-balance text-muted-foreground">
          Certains graphiques comptent plusieurs dizaines de catégories : à la
          verticale, ils sont illisibles. Passe en mode paysage pour afficher la
          page.
        </p>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Monitor className="size-3.5" />
        Encore mieux sur un ordinateur.
      </p>
    </div>
  )
}
