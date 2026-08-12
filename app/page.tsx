import { ChartCard } from "@/components/chart-card"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { charts, generatedAt, missingCharts, summary } from "@/lib/stats"

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(value))
}

const numberFormat = new Intl.NumberFormat("fr-FR")

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-6 md:py-14">
        <section className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">
            Aesthetic Whale
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Statistiques des reports
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground text-balance">
            Analyse de l&apos;activité de modération du bot Discord Aesthetic
            Whale. Données générées le {formatGeneratedAt(generatedAt)}.
          </p>
        </section>

        {summary ? (
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-lg font-medium">{summary.title}</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              {summary.data.map((item) => (
                <Card key={item.label}>
                  <CardContent className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className={
                        typeof item.value === "string" && item.value.length > 12
                          ? "font-mono text-sm font-semibold tabular-nums"
                          : "font-mono text-xl font-semibold tabular-nums"
                      }
                    >
                      {typeof item.value === "number"
                        ? numberFormat.format(item.value)
                        : item.value}
                    </span>
                    {item.detail ? (
                      <span className="text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <Separator />

        <section className="flex flex-col gap-6">
          {charts.map((chart) => (
            <ChartCard key={chart.id} chart={chart} />
          ))}
        </section>

        <footer className="flex flex-col gap-1 pt-2 text-xs text-muted-foreground">
          <span>
            {charts.length} graphiques · source : base de données des reports
            Aesthetic Whale.
          </span>
          {missingCharts.length > 0 ? (
            <span>
              Annoncés dans index.json mais absents de l&apos;export :{" "}
              {missingCharts.join(", ")}.
            </span>
          ) : null}
        </footer>
      </main>
    </>
  )
}
