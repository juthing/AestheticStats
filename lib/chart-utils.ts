import type { ChartRow, ChartSeries, StatsChart } from "@/lib/stats"

/**
 * Validated categorical palette: 8 fixed slots, assigned in order and never
 * cycled. Past 8 series we fold the tail into "Autres" rather than reusing a
 * hue, so two different entities are never painted the same color.
 */
export const PALETTE_SIZE = 8
/** 8 hues x 2 tints: past this a series folds into "Autres". */
export const MAX_SERIES = 16
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

/**
 * Weeks come out of the generator as `%Y-%W` (Monday-based, week 00 is the
 * stretch before the year's first Monday) — verified against the export's
 * bounds. A bare "S31 25" says nothing, so labels use the week's Monday.
 */
function weekStart(value: string) {
  const match = /^(\d{4})-(\d{1,2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const week = Number(match[2])
  const jan1 = new Date(Date.UTC(year, 0, 1))
  // Monday of week 01, then step back a week per unit below it.
  const offsetToMonday = (8 - (jan1.getUTCDay() || 7)) % 7
  const firstMonday = new Date(jan1)
  firstMonday.setUTCDate(jan1.getUTCDate() + offsetToMonday)
  const monday = new Date(firstMonday)
  monday.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7)
  return monday
}

const weekTickFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
})

const weekLongFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

/** "2026-32" -> "10 août 26" */
export function formatWeek(value: string) {
  const monday = weekStart(value)
  return monday ? weekTickFormat.format(monday) : value
}

/** "2026-32" -> "Semaine du 10 août 2026" */
export function formatWeekLong(value: string) {
  const monday = weekStart(value)
  return monday ? `Semaine du ${weekLongFormat.format(monday)}` : value
}

export function tooltipLabelFormatter(xKey: string | undefined) {
  if (xKey === "mois") return formatMonth
  if (xKey === "semaine") return formatWeekLong
  return (value: string) => value
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
 * Recolors the series on the fixed palette and, past MAX_SERIES of them, keeps
 * the largest and sums the rest into a single "Autres" series.
 *
 * Keys are also slugged to `s0`, `s1`, … : the generator's keys carry spaces and
 * accents ("Faits avérés mais mineurs"), and shadcn/ui's ChartStyle turns every
 * config key into a `--color-KEY` custom property, which those cannot be. With
 * slugs the charts use `var(--color-s0)` exactly as the docs describe.
 */
export function resolveSeries(chart: StatsChart): {
  series: ChartSeries[]
  data: ChartRow[]
  folded: number
} {
  const source = chart.series ?? []
  const xKey = chart.xKey

  const totals = new Map<string, number>()
  for (const item of source) {
    let sum = 0
    for (const row of chart.data) {
      const value = row[item.key]
      if (typeof value === "number") sum += value
    }
    totals.set(item.key, sum)
  }

  const kept =
    source.length <= MAX_SERIES
      ? source
      : [...source]
          .sort((a, b) => (totals.get(b.key) ?? 0) - (totals.get(a.key) ?? 0))
          .slice(0, MAX_SERIES)
  const keptKeys = new Set(kept.map((item) => item.key))
  const dropped = source.filter((item) => !keptKeys.has(item.key))

  // A lone series keeps whatever accent the generator asked for; multi-series
  // charts get the slots in order, since the generator cycles --chart-1..5 and
  // would otherwise paint two series the same.
  const series: ChartSeries[] = kept.map((item, index) => ({
    key: `s${index}`,
    label: item.label,
    color:
      kept.length === 1 && /^var\(--chart-[1-8]\)$/.test(item.color)
        ? item.color
        : slotColor(index),
  }))
  if (dropped.length > 0) {
    series.push({
      key: `s${kept.length}`,
      label: `Autres (${dropped.length})`,
      color: OTHER_COLOR,
    })
  }

  const data = chart.data.map((row) => {
    const next: ChartRow = {}
    if (xKey) next[xKey] = row[xKey]
    kept.forEach((item, index) => {
      next[`s${index}`] = row[item.key] ?? 0
    })
    if (dropped.length > 0) {
      let other = 0
      for (const item of dropped) {
        const value = row[item.key]
        if (typeof value === "number") other += value
      }
      next[`s${kept.length}`] = other
    }
    return next
  })

  return { series, data, folded: dropped.length }
}
