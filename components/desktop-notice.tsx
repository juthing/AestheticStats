"use client"

import * as React from "react"
import { Monitor, X } from "lucide-react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "aesthetic-stats:desktop-notice-dismissed"
const EVENT = "aesthetic-stats:desktop-notice"

function subscribe(onChange: () => void) {
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

/**
 * Charts with 30-odd categories are cramped on a phone. The notice reads from
 * localStorage through useSyncExternalStore, whose server snapshot is
 * "dismissed": nothing is rendered server-side, so a reader who already
 * dismissed it never sees it flash back on hydration.
 */
export function DesktopNotice() {
  const dismissed = React.useSyncExternalStore(subscribe, isDismissed, () => true)

  if (dismissed) return null

  return (
    <Alert className="md:hidden">
      <Monitor />
      <AlertTitle>Mieux sur grand écran</AlertTitle>
      <AlertDescription>
        Certains graphiques comptent plusieurs dizaines de catégories : ils sont
        bien plus lisibles sur ordinateur.
      </AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1")
            window.dispatchEvent(new Event(EVENT))
          }}
        >
          <X />
          <span className="sr-only">Ignorer</span>
        </Button>
      </AlertAction>
    </Alert>
  )
}
