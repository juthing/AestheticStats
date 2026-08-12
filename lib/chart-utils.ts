import type { ChartRow, ChartSeries, StatsChart } from "@/lib/stats"

/**
 * Validated categorical palette: 8 fixed slots, assigned in order and never
 * cycled. Past 8 series we fold the tail into "Autres" rather than reusing a
 * hue, so two different entities are never painted the same color.
 */
export const PALETTE_SIZE = 8
export const OTHER_KEY = "Autres"
export const OTHER_COLOR = "var(--muted-foreground)"

/**
 * Past the 8th slot the hues repeat, but each repeat is lightened so slot 9
 * reads as a tint of slot 1 rather than the same color twice. Two tints cover
 * 16 categories; the palette is never extended with invented hues.
 */
export function slotColor(index: number) {
  const hue = `var(--chart-${(index % PALETTE_SIZE) + 1})`
  const cycle = Math.floor(index / PALETTE_SIZE)
  if (cycle === 0) return hue
  const strength = Math.max(30, 100 - cycle * 45)
  return `color-mix(in oklab, ${hue} ${strength}%, var(--chart-tint))`
}

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
]

/** "2026-03" -> "mars 26", "2026-12" -> "déc. 26" */
export function formatMonth(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return value
  const month = MONTHS[Number(match[2]) - 1]
  return month ? `${month} ${match[1].slice(2)}` : value
}

/** "2026-03" -> "S03 26" (ISO week number, not a month) */
export function formatWeek(value: string) {
  const match = /^(\d{4})-(\d{1,2})$/.exec(value)
  if (!match) return value
  return `S${match[2]} ${match[1].slice(2)}`
}

export function axisFormatter(xKey: string | undefined) {
  if (xKey === "mois") return formatMonth
  if (xKey === "semaine") return formatWeek
  return (value: string) => value
}

export function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

/**
 * Axis labels only. Discord snowflakes are 19 digits of nothing readable, so
 * ticks keep the last 6; the tooltip and the data table still show them whole.
 */
export function shortenTick(value: string, max: number) {
  if (/^\d{15,}$/.test(value)) return `…${value.slice(-6)}`
  return truncate(value, max)
}

export const numberFormatter = new Intl.NumberFormat("fr-FR")

const shareFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 0.169 -> "16,9" — always one decimal so the column lines up. */
export function formatShare(ratio: number) {
  return shareFormatter.format(ratio * 100)
}

export function formatNumber(value: unknown) {
  return typeof value === "number" ? numberFormatter.format(value) : String(value)
}

/** A series is a percentage when its own label says so. */
export function isPercentSeries(series: ChartSeries[] | undefined) {
  return Boolean(series?.every((item) => item.label.includes("%")))
}

/**
 * Recolors the series on the fixed palette and, past 8 of them, keeps the 8
 * largest and sums the rest into a single "Autres" series.
 */
export function resolveSeries(chart: StatsChart): {
  series: ChartSeries[]
  data: ChartRow[]
  folded: number
} {
  const series = chart.series ?? []

  if (series.length <= PALETTE_SIZE) {
    return {
      series: series.map((item, index) => ({ ...item, color: slotColor(index) })),
      data: chart.data,
      folded: 0,
    }
  }

  const totals = new Map<string, number>()
  for (const item of series) {
    let sum = 0
    for (const row of chart.data) {
      const value = row[item.key]
      if (typeof value === "number") sum += value
    }
    totals.set(item.key, sum)
  }

  const kept = [...series]
    .sort((a, b) => (totals.get(b.key) ?? 0) - (totals.get(a.key) ?? 0))
    .slice(0, PALETTE_SIZE)
  const keptKeys = new Set(kept.map((item) => item.key))
  const dropped = series.filter((item) => !keptKeys.has(item.key))

  const data = chart.data.map((row) => {
    const next: ChartRow = { ...row }
    let other = 0
    for (const item of dropped) {
      const value = next[item.key]
      if (typeof value === "number") other += value
      delete next[item.key]
    }
    next[OTHER_KEY] = other
    return next
  })

  return {
    series: [
      ...kept.map((item, index) => ({ ...item, color: slotColor(index) })),
      { key: OTHER_KEY, label: `Autres (${dropped.length})`, color: OTHER_COLOR },
    ],
    data,
    folded: dropped.length,
  }
}
