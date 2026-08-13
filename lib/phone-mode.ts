"use client"

import * as React from "react"

/**
 * A phone, not a narrow window: touch input with no hover rules out desktops
 * whatever their size, and a short side under 500px rules out tablets. Width
 * alone cannot do it — a phone in landscape is 844px wide, wider than an iPad
 * held upright.
 */
export const PHONE_QUERY =
  "(hover: none) and (pointer: coarse) and ((max-width: 500px) or (max-height: 500px))"
export const PORTRAIT_QUERY = "(orientation: portrait)"

/** Chrome-only, still absent from TS's DOM lib as a typed member. */
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: string) => Promise<void>
}

/**
 * Best-effort auto-rotate: most engines only grant `orientation.lock` inside
 * fullscreen, and Safari/iOS exposes neither, so this silently no-ops there —
 * the manual "turn your phone" instructions remain the real fallback.
 */
export async function tryLockLandscape() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.()
    }
    await (screen.orientation as LockableOrientation)?.lock?.("landscape")
  } catch {
    // Unsupported or rejected — nothing to recover from, the gate stays up.
  }
}

export function releaseLandscapeLock() {
  screen.orientation?.unlock?.()
  if (document.fullscreenElement) {
    void document.exitFullscreen?.().catch(() => {})
  }
}

/**
 * Subscribes to a media query without a mount flag: the server snapshot is
 * `false`, so nothing depending on it renders server-side and hydration stays
 * clean.
 */
export function useMediaQuery(query: string) {
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
