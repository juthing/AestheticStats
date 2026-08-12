"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts"

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
  formatNumber,
  formatShare,
  isPercentSeries,
  resolveSeries,
  shortenTick,
  slotColor,
} from "@/lib/chart-utils"
import type { StatsChart } from "@/lib/stats"

/** Bars with many categories are laid out horizontally so labels stay readable. */
const VERTICAL_BAR_THRESHOLD = 12

export function StatChart({ chart }: { chart: StatsChart }) {
  const { series, data } = React.useMemo(() => resolveSeries(chart), [chart])
  const xKey = chart.xKey ?? "name"
  const percent = isPercentSeries(chart.series)
  const formatXAxis = axisFormatter(chart.xKey)

  /**
   * Slices are normalized to `{ label, value }`: the raw name key can collide
   * with a Recharts payload property ("type" is one), which silently breaks the
   * legend label lookup.
   */
  const slices = React.useMemo(() => {
    if (chart.chartType !== "pie") return []
    const nameKey = chart.nameKey ?? xKey
    const dataKey = chart.dataKey ?? "total"
    return chart.data.map((row) => ({
      label: String(row[nameKey]),
      value: Number(row[dataKey] ?? 0),
    }))
  }, [chart, xKey])

  /**
   * Labels only: series keys carry spaces and accents ("Faits avérés mais
   * mineurs"), which cannot become CSS custom properties. Colors go straight to
   * the marks instead of through `var(--color-KEY)`.
   */
  const config = React.useMemo(() => {
    if (chart.chartType === "pie") {
      return Object.fromEntries(
        slices.map((slice) => [slice.label, { label: slice.label }])
      ) satisfies ChartConfig
    }

    return Object.fromEntries(
      series.map((item) => [item.key, { label: item.label }])
    ) satisfies ChartConfig
  }, [chart.chartType, series, slices])

  const valueFormatter = React.useCallback(
    (value: unknown) => (percent ? `${formatNumber(value)} %` : formatNumber(value)),
    [percent]
  )

  const tooltip = (
    <ChartTooltip
      content={
        <ChartTooltipContent
          labelFormatter={(label) =>
            typeof label === "string" ? formatXAxis(label) : label
          }
        />
      }
    />
  )

  const legend =
    series.length > 1 || chart.chartType === "pie" ? (
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
              content={<ChartTooltipContent nameKey="label" hideLabel />}
            />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="46%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {slices.map((slice, index) => (
                <Cell key={slice.label} fill={slotColor(index)} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Legend as a list rather than a chip row: it carries the count and
            the share, which is what the slices are actually read for. */}
        <ul className="flex w-full flex-col gap-1 text-sm md:w-1/2">
          {slices.map((slice, index) => (
            <li key={slice.label} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: slotColor(index) }}
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
      <ChartContainer config={config} className="mx-auto h-[340px] w-full">
        <RadarChart data={data}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <PolarGrid />
          <PolarAngleAxis dataKey={xKey} tickFormatter={formatXAxis} />
          {series.map((item) => (
            <Radar
              key={item.key}
              dataKey={item.key}
              fill={item.color}
              fillOpacity={0.5}
              stroke={item.color}
              strokeWidth={2}
            />
          ))}
          {legend}
        </RadarChart>
      </ChartContainer>
    )
  }

  if (chart.chartType === "line") {
    return (
      <ChartContainer config={config} className="h-[320px] w-full">
        <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
            tickFormatter={formatXAxis}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={percent ? 56 : 44}
            tickFormatter={(value) => valueFormatter(value)}
          />
          {tooltip}
          {series.map((item) => (
            <Line
              key={item.key}
              dataKey={item.key}
              type="monotone"
              stroke={item.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
          {legend}
        </LineChart>
      </ChartContainer>
    )
  }

  if (chart.chartType === "area") {
    return (
      <ChartContainer config={config} className="h-[360px] w-full">
        <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={24}
            tickFormatter={formatXAxis}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={percent ? 56 : 44}
            tickFormatter={(value) => valueFormatter(value)}
          />
          {tooltip}
          {series.map((item) => (
            <Area
              key={item.key}
              dataKey={item.key}
              type="monotone"
              stackId={chart.stacked ? "a" : undefined}
              fill={item.color}
              fillOpacity={0.75}
              stroke={item.color}
              strokeWidth={1}
            />
          ))}
          {legend}
        </AreaChart>
      </ChartContainer>
    )
  }

  // Bar
  const vertical =
    chart.layout === "vertical" || data.length > VERTICAL_BAR_THRESHOLD
  const height = vertical
    ? Math.max(280, data.length * (series.length > 1 ? 30 : 24) + 80)
    : 320
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
        data={data}
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
              tickFormatter={(value: string) =>
                shortenTick(formatXAxis(value), data.length <= 6 ? 26 : 14)
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
            fill={item.color}
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
