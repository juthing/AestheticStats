"use client"

import * as React from "react"
import { Monitor } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PHONE_QUERY, PORTRAIT_QUERY, useMediaQuery } from "@/lib/phone-mode"

/**
 * Shown on every load rather than remembered: closing it is a decision about
 * this visit, not a preference. Held back while the rotate gate is up, so the
 * reader never meets two overlays at once.
 */
export function DesktopNotice() {
  const isPhone = useMediaQuery(PHONE_QUERY)
  const isPortrait = useMediaQuery(PORTRAIT_QUERY)
  const [closed, setClosed] = React.useState(false)

  return (
    <Dialog
      open={isPhone && !isPortrait && !closed}
      onOpenChange={(open) => {
        if (!open) setClosed(true)
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)]">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
            <Monitor className="size-5" />
          </div>
          <DialogTitle>Mieux sur ordinateur</DialogTitle>
          <DialogDescription>
            Certains graphiques comptent plusieurs dizaines de catégories. Sur un
            écran de téléphone, ils restent lisibles mais serrés.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="w-full" onClick={() => setClosed(true)}>
            Continuer sur mon téléphone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
