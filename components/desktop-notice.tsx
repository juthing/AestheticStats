"use client"

import * as React from "react"
import { Monitor, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STORAGE_KEY = "aesthetic-stats:desktop-notice-dismissed"
const EVENT = "aesthetic-stats:desktop-notice"

function subscribeDismissed(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(EVENT, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(EVENT, onChange)
  }
}

function isDismissed() {
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

/** Subscribes to a media query without a mount flag, so SSR renders nothing. */
function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query]
  )

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

/**
 * Landscape can only be locked from fullscreen, and only where the Screen
 * Orientation API allows it — Android does, iOS Safari does not. Returns
 * whether the lock actually took, so the caller can fall back to asking.
 */
type LockableOrientation = ScreenOrientation & {
  // Absent from the standard DOM types: the method is not universally shipped.
  lock?: (orientation: "landscape") => Promise<void>
}

async function lockLandscape() {
  const orientation = window.screen?.orientation as
    | LockableOrientation
    | undefined
  if (!orientation?.lock || !document.documentElement.requestFullscreen) {
    return false
  }

  const wasFullscreen = Boolean(document.fullscreenElement)
  try {
    if (!wasFullscreen) await document.documentElement.requestFullscreen()
    await orientation.lock("landscape")
    return true
  } catch {
    // Do not strand the reader in a fullscreen portrait page.
    if (!wasFullscreen && document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
    }
    return false
  }
}

export function DesktopNotice() {
  const dismissed = React.useSyncExternalStore(
    subscribeDismissed,
    isDismissed,
    () => true
  )
  const isPhone = useMediaQuery("(max-width: 767px)")
  const isPortrait = useMediaQuery("(orientation: portrait)")
  const [askRotate, setAskRotate] = React.useState(false)

  async function continueOnPhone() {
    window.localStorage.setItem(STORAGE_KEY, "1")
    window.dispatchEvent(new Event(EVENT))
    const locked = await lockLandscape()
    setAskRotate(!locked)
  }

  return (
    <>
      <Dialog
        open={isPhone && !dismissed}
        onOpenChange={(open) => {
          if (!open) void continueOnPhone()
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)]">
          <DialogHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
              <Monitor className="size-5" />
            </div>
            <DialogTitle>Mieux sur ordinateur</DialogTitle>
            <DialogDescription>
              Certains graphiques comptent plusieurs dizaines de catégories.
              Sur un écran de téléphone, ils restent lisibles mais serrés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => void continueOnPhone()}>
              Continuer sur mon téléphone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fallback where the orientation lock is refused (iOS, and any browser
          outside fullscreen): ask for the rotation instead of forcing it. */}
      {askRotate && isPhone && isPortrait ? (
        <div className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg md:hidden">
          <RotateCw className="size-4 shrink-0" />
          <span className="flex-1">
            Tourne ton téléphone à l&apos;horizontale pour mieux lire les
            graphiques.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setAskRotate(false)}
          >
            OK
          </Button>
        </div>
      ) : null}
    </>
  )
}
