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
      { rootMargin: "0px 0px -10% 0px" }
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
