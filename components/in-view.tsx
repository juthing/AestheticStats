"use client"

import * as React from "react"

/**
 * Holds a chart back until it scrolls into view, so Recharts mounts — and plays
 * its entry animation — as the reader arrives rather than all at once on load.
 * The placeholder reserves the chart's own height, so nothing shifts.
 */
export function InView({
  minHeight,
  children,
}: {
  minHeight: number
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      // The trigger line sits a quarter of the viewport above its bottom edge,
      // so a chart starts drawing once it is properly in front of the reader
      // rather than the instant its top edge appears.
      { rootMargin: "0px 0px -25% 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible ? children : null}
    </div>
  )
}
