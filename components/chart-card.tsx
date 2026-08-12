"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InView } from "@/components/in-view"
import { StatChart } from "@/components/stat-chart"
import { chartHeight, formatNumber } from "@/lib/chart-utils"
import type { StatsChart } from "@/lib/stats"

/** Discord snowflakes and other raw ids stay out of the table. */
function tableColumns(chart: StatsChart) {
  const keys = new Set<string>()
  for (const row of chart.data) {
    for (const key of Object.keys(row)) {
      if (key === "fill" || key.endsWith("Id")) continue
      keys.add(key)
    }
  }

  const xKey = chart.xKey
  const rest = [...keys].filter((key) => key !== xKey)
  return xKey && keys.has(xKey) ? [xKey, ...rest] : rest
}

export function ChartCard({ chart }: { chart: StatsChart }) {
  const columns = React.useMemo(() => tableColumns(chart), [chart])

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{chart.title}</CardTitle>
        <CardDescription className="text-balance">
          {chart.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList variant="line" className="mb-2">
            <TabsTrigger value="chart">Graphique</TabsTrigger>
            <TabsTrigger value="data">Données</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <InView minHeight={chartHeight(chart)}>
              <StatChart chart={chart} />
            </InView>
          </TabsContent>
          <TabsContent value="data">
            <div className="max-h-[420px] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chart.data.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell
                          key={column}
                          className={
                            typeof row[column] === "number"
                              ? "text-right font-mono tabular-nums"
                              : "whitespace-nowrap"
                          }
                        >
                          {row[column] === undefined || row[column] === null
                            ? "—"
                            : formatNumber(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
