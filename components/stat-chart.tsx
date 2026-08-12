"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  axisFormatter,
  chartHeight,
  formatNumber,
  formatWeekMonth,
  monthTicks,
  formatShare,
  isPercentSeries,
  resolveSeries,
  shortenTick,
  slotColor,
  VERTICAL_BAR_THRESHOLD,
  tooltipLabelFormatter,
} from "@/lib/chart-utils"
import type { ChartSeries, StatsChart } from "@/lib/stats"

/** Series toggles appear once a line chart carries more than this many curves. */
const TOGGLE_THRESHOLD = 2

/** Beyond this many stacked bands a gradient fill turns to mush. */
const GRADIENT_SERIES_LIMIT = 4

function SeriesToggles({
  series,
  hidden,
  onToggle,
  onReset,
}: {
  series: ChartSeries[]
  hidden: ReadonlySet<string>
  onToggle: (key: string) => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
      {series.map((item) => {
        const shown = !hidden.has(item.key)
        return (
          <Toggle
            key={item.key}
            size="sm"
            variant="outline"
            pressed={shown}
            onPressedChange={() => onToggle(item.key)}
            className="gap-1.5 text-xs data-unchecked:text-muted-foreground"
          >
            {/* The toggles sit outside the chart's `data-chart` scope, so they
                use the global --chart-* token rather than --color-<key>. */}
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: shown ? item.color : "transparent",
                boxShadow: shown ? undefined : `inset 0 0 0 1px ${item.color}`,
              }}
            />
            {item.label}
          </Toggle>
        )
      })}
      {hidden.size > 0 ? (
        <Button variant="ghost" size="sm" className="text-xs" onClick={onReset}>
          Tout afficher
        </Button>
      ) : null}
    </div>
  )
}

export function StatChart({ chart }: { chart: StatsChart }) {
  const { series, data } = React.useMemo(() => resolveSeries(chart), [chart])
  const xKey = chart.xKey ?? "name"
  const percent = isPercentSeries(chart.series)
  const formatXAxis = axisFormatter(chart.xKey)
  const formatTooltipLabel = tooltipLabelFormatter(chart.xKey)
  // A weekly axis is labelled by month: 53 week labels are unreadable, and the
  // tooltip still names the exact week.
  const weekAxis = chart.xKey === "semaine"
  const weekTicks = weekAxis ? monthTicks(data, xKey) : undefined
  const formatCategory = weekAxis ? formatWeekMonth : formatXAxis

  // Gradient ids have to be unique per chart instance and valid in url(...).
  const uid = React.useId().replace(/:/g, "")
  const gradientId = (index: number) => `${uid}-fill-${index}`
  /** A gradient reads well on a few bands; a dense stack needs flat fills. */
  const gradientFill = series.length <= GRADIENT_SERIES_LIMIT

  const [hidden, setHidden] = React.useState<ReadonlySet<string>>(new Set())
  const toggleSeries = React.useCallback((key: string) => {
    setHidden((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  }, [])
  const resetSeries = React.useCallback(() => setHidden(new Set()), [])

  const toggleable =
    chart.chartType === "line" && series.length > TOGGLE_THRESHOLD
  const visibleSeries = toggleable
    ? series.filter((item) => !hidden.has(item.key))
    : series

  /**
   * Slices are normalized to `{ label, value }`: the raw name key can collide
   * with a Recharts payload property ("type" is one), which silently breaks the
   * legend label lookup.
   */
  const slices = React.useMemo(() => {
    if (chart.chartType !== "pie") return []
    const nameKey = chart.nameKey ?? xKey
    const dataKey = chart.dataKey ?? "total"
    return chart.data.map((row, index) => ({
      key: `p${index}`,
      label: String(row[nameKey]),
      value: Number(row[dataKey] ?? 0),
      color: slotColor(index),
    }))
  }, [chart, xKey])

  /**
   * Slugged keys carry the color, so shadcn/ui's ChartStyle emits a valid
   * `--color-<key>` for every series and the marks reference it with
   * `var(--color-...)` as the docs describe.
   */
  const config = React.useMemo(() => {
    if (chart.chartType === "pie") {
      return Object.fromEntries(
        slices.map((slice) => [
          slice.key,
          { label: slice.label, color: slice.color },
        ])
      ) satisfies ChartConfig
    }

    return Object.fromEntries(
      series.map((item) => [item.key, { label: item.label, color: item.color }])
    ) satisfies ChartConfig
  }, [chart.chartType, series, slices])

  const valueFormatter = React.useCallback(
    (value: unknown) => (percent ? `${formatNumber(value)} %` : formatNumber(value)),
    [percent]
  )

  const tooltip = (
    <ChartTooltip
      cursor={false}
      content={
        <ChartTooltipContent
          indicator="dot"
          labelFormatter={(label) =>
            typeof label === "string" ? formatTooltipLabel(label) : label
          }
        />
      }
    />
  )

  const legend =
    series.length > 1 ? (
      <ChartLegend
        content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1.5" />}
      />
    ) : null

  if (chart.chartType === "pie") {
    const total = slices.reduce((acc, slice) => acc + slice.value, 0)

    return (
      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
        <ChartContainer
          config={config}
          className="h-[300px] w-full md:h-[340px] md:w-1/2"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="key" hideLabel />}
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="key"
              innerRadius="46%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Legend as a list rather than a chip row: it carries the count and
            the share, which is what the slices are actually read for. */}
        <ul className="flex w-full flex-col gap-1 text-sm md:w-1/2">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-center gap-2">
              {/* Outside the chart's `data-chart` scope, so --color-<key> is
                  not defined here: use the global --chart-* token. */}
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate" title={slice.label}>
                {slice.label}
              </span>
              <span className="font-mono tabular-nums">
                {formatNumber(slice.value)}
              </span>
              <span className="w-14 text-right font-mono text-muted-foreground tabular-nums">
                {total > 0 ? `${formatShare(slice.value / total)} %` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (chart.chartType === "radar") {
    return (
      <ChartContainer config={config} className="mx-auto h-[360px] w-full">
        <RadarChart data={data} outerRadius="72%">
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <PolarGrid />
          <PolarAngleAxis dataKey={xKey} tickFormatter={formatXAxis} />
          {series.map((item) => (
            <Radar
              key={item.key}
              dataKey={item.key}
              fill={`var(--color-${item.key})`}
              fillOpacity={0.4}
              stroke={`var(--color-${item.key})`}
              strokeWidth={2}
              dot={{ r: 2.5, fillOpacity: 1 }}
            />
          ))}
          {legend}
        </RadarChart>
      </ChartContainer>
    )
  }

  if (chart.chartType === "line") {
    return (
      <div className="flex flex-col">
        <ChartContainer config={config} className="h-[320px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={32}
              ticks={weekTicks}
              tickFormatter={formatCategory}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={percent ? 56 : 44}
              tickFormatter={(value) => valueFormatter(value)}
            />
            {tooltip}
            {visibleSeries.map((item) => (
              <Line
                key={item.key}
                dataKey={item.key}
                type="monotone"
                stroke={`var(--color-${item.key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            {toggleable ? null : legend}
          </LineChart>
        </ChartContainer>
        {toggleable ? (
          <SeriesToggles
            series={series}
            hidden={hidden}
            onToggle={toggleSeries}
            onReset={resetSeries}
          />
        ) : null}
      </div>
    )
  }

  if (chart.chartType === "area") {
    return (
      <ChartContainer config={config} className="h-[360px] w-full">
        <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 12 }}>
          <defs>
            {gradientFill
              ? series.map((item, index) => (
                  <linearGradient
                    key={item.key}
                    id={gradientId(index)}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={`var(--color-${item.key})`}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={`var(--color-${item.key})`}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))
              : null}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={32}
            ticks={weekTicks}
            tickFormatter={formatCategory}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={percent ? 56 : 44}
            tickFormatter={(value) => valueFormatter(value)}
          />
          {tooltip}
          {series.map((item, index) => (
            <Area
              key={item.key}
              dataKey={item.key}
              type="natural"
              stackId={chart.stacked ? "a" : undefined}
              fill={
                gradientFill
                  ? `url(#${gradientId(index)})`
                  : `var(--color-${item.key})`
              }
              fillOpacity={gradientFill ? 1 : 0.75}
              stroke={`var(--color-${item.key})`}
              strokeWidth={2}
            />
          ))}
          {legend}
        </AreaChart>
      </ChartContainer>
    )
  }

  // Bar
  // A time axis always reads left to right, however many points it carries.
  const timeAxis = chart.xKey === "mois" || chart.xKey === "semaine"
  const vertical =
    chart.layout === "vertical" ||
    (!timeAxis && data.length > VERTICAL_BAR_THRESHOLD)
  // A ranking reads top-down: biggest bar first. Only single-series charts are
  // reordered — a stack's own order (by volume) carries meaning.
  const barData =
    vertical && series.length === 1
      ? [...data].sort((a, b) => Number(b[series[0].key]) - Number(a[series[0].key]))
      : data
  const height = chartHeight(chart)
  // A stack whose rows all add up to 100 is a share, not a count: stop the axis
  // at 100 instead of letting Recharts round up to 120.
  const stackedPercent =
    Boolean(chart.stacked) &&
    data.every((row) => {
      const sum = series.reduce((acc, item) => {
        const value = row[item.key]
        return acc + (typeof value === "number" ? value : 0)
      }, 0)
      return sum > 99 && sum < 101
    })
  const percentAxis = percent || stackedPercent
  const domain: [number, number] | undefined = percentAxis ? [0, 100] : undefined
  // Rounding can push a stack to 100.1; pin the ticks so the axis still reads 0-100.
  const ticks = percentAxis ? [0, 20, 40, 60, 80, 100] : undefined
  const formatBarAxis = (value: unknown) =>
    percentAxis ? `${formatNumber(value)} %` : formatNumber(value)
  // Few enough bars to label each one directly instead of reading the axis.
  const directLabels = series.length === 1 && data.length <= 8

  return (
    <ChartContainer
      config={config}
      className="w-full"
      style={{ height: `${height}px` }}
    >
      <BarChart
        accessibilityLayer
        data={barData}
        layout={vertical ? "vertical" : "horizontal"}
        margin={{ left: 4, right: 16, top: directLabels ? 20 : 4 }}
      >
        <CartesianGrid horizontal={!vertical} vertical={vertical} />
        {vertical ? (
          <>
            <XAxis
              type="number"
              domain={domain}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatBarAxis}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={140}
              interval={0}
              tickFormatter={(value: string) => shortenTick(formatXAxis(value), 16)}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              interval={0}
              ticks={weekTicks}
              tickFormatter={(value: string) =>
                weekAxis
                  ? formatWeekMonth(value)
                  : shortenTick(formatXAxis(value), data.length <= 6 ? 26 : 14)
              }
            />
            <YAxis
              domain={domain}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={percentAxis ? 56 : 44}
              tickFormatter={formatBarAxis}
            />
          </>
        )}
        {tooltip}
        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            stackId={chart.stacked ? "a" : undefined}
            fill={`var(--color-${item.key})`}
            radius={4}
            maxBarSize={vertical ? 22 : 56}
            stroke="var(--background)"
            strokeWidth={chart.stacked ? 1 : 0}
          >
            {directLabels ? (
              <LabelList
                position={vertical ? "right" : "top"}
                offset={8}
                className="fill-muted-foreground"
                fontSize={12}
                formatter={(value: unknown) => valueFormatter(value)}
              />
            ) : null}
          </Bar>
        ))}
        {legend}
      </BarChart>
    </ChartContainer>
  )
}
