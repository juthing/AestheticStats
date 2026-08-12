import indexJson from "@/stats/index.json"
import acteursActifsParMois from "@/stats/acteurs_actifs_par_mois.json"
import activiteStaffParMois from "@/stats/activite_staff_par_mois.json"
import ciblesRecidivistes from "@/stats/cibles_recidivistes.json"
import classementStaff from "@/stats/classement_staff.json"
import completudeDonnees from "@/stats/completude_donnees.json"
import decisionsParStaff from "@/stats/decisions_par_staff.json"
import impactCommentaire from "@/stats/impact_commentaire.json"
import matriceTypeDecision from "@/stats/matrice_type_decision.json"
import motifsBlacklist from "@/stats/motifs_blacklist.json"
import reportsParHeure from "@/stats/reports_par_heure.json"
import reportsParJourSemaine from "@/stats/reports_par_jour_semaine.json"
import reportsParMois from "@/stats/reports_par_mois.json"
import repartitionDecisions from "@/stats/repartition_decisions.json"
import repartitionTypesDemande from "@/stats/repartition_types_demande.json"
import reportsParSemaine from "@/stats/reports_par_semaine.json"
import resume from "@/stats/resume.json"
import tauxBlacklistMensuel from "@/stats/taux_blacklist_mensuel.json"
import tauxBlacklistParType from "@/stats/taux_blacklist_par_type.json"
import staffsActuelsCumul from "@/stats/staffs_actuels_cumul.json"
import topEmetteurs from "@/stats/top_emetteurs.json"
import topServeurs from "@/stats/top_serveurs.json"

export type ChartType = "stats" | "line" | "bar" | "area" | "pie" | "radar"

export type ChartSeries = {
  key: string
  label: string
  color: string
}

export type ChartRow = Record<string, string | number | null>

export type StatItem = {
  label: string
  value: string | number
  detail?: string
}

export type StatsChart = {
  id: string
  title: string
  description: string
  chartType: ChartType
  file?: string
  xKey?: string
  series?: ChartSeries[]
  layout?: "vertical" | "horizontal"
  stacked?: boolean
  nameKey?: string
  dataKey?: string
  data: ChartRow[]
}

export type SummaryChart = Omit<StatsChart, "data"> & { data: StatItem[] }

/**
 * index.json lists every chart the generator knows about, but the export can be
 * partial. Only the files actually present are registered here; anything listed
 * in the index without a matching entry is skipped instead of breaking the page.
 */
const registry: Record<string, unknown> = {
  acteurs_actifs_par_mois: acteursActifsParMois,
  activite_staff_par_mois: activiteStaffParMois,
  cibles_recidivistes: ciblesRecidivistes,
  classement_staff: classementStaff,
  completude_donnees: completudeDonnees,
  decisions_par_staff: decisionsParStaff,
  impact_commentaire: impactCommentaire,
  matrice_type_decision: matriceTypeDecision,
  motifs_blacklist: motifsBlacklist,
  reports_par_heure: reportsParHeure,
  reports_par_jour_semaine: reportsParJourSemaine,
  reports_par_mois: reportsParMois,
  repartition_decisions: repartitionDecisions,
  repartition_types_demande: repartitionTypesDemande,
  reports_par_semaine: reportsParSemaine,
  resume: resume,
  taux_blacklist_mensuel: tauxBlacklistMensuel,
  taux_blacklist_par_type: tauxBlacklistParType,
  staffs_actuels_cumul: staffsActuelsCumul,
  top_emetteurs: topEmetteurs,
  top_serveurs: topServeurs,
}

const index = indexJson as {
  generatedAt: string
  source: string
  charts: { id: string; chartType: string }[]
}

export const generatedAt = index.generatedAt

/** Junk decision values kept out of every chart, series and table. */
const EXCLUDED_VALUES = new Set(["Refuse: il a dit"])

function withoutExcludedValues(chart: StatsChart): StatsChart {
  const series = chart.series?.filter((item) => !EXCLUDED_VALUES.has(item.key))
  const xKey = chart.xKey

  const data = chart.data
    .filter((row) => !(xKey && EXCLUDED_VALUES.has(String(row[xKey]))))
    .map((row) => {
      const next: ChartRow = {}
      for (const [key, value] of Object.entries(row)) {
        if (!EXCLUDED_VALUES.has(key)) next[key] = value
      }
      return next
    })

  // `chartConfig` is the generator's own copy of the series list; it is unused
  // here and would otherwise ship the excluded values to the client.
  const rest = { ...chart } as StatsChart & { chartConfig?: unknown }
  delete rest.chartConfig

  return { ...rest, series, data }
}

const ordered = index.charts
  .map((entry) => registry[entry.id])
  .filter((chart): chart is object => Boolean(chart))
  .map((chart) => withoutExcludedValues(chart as unknown as StatsChart))

export const summary = ordered.find(
  (chart) => chart.chartType === "stats"
) as unknown as SummaryChart | undefined

export const charts = ordered.filter((chart) => chart.chartType !== "stats")

/** Ids listed in index.json but missing from the export. */
export const missingCharts = index.charts
  .filter((entry) => !registry[entry.id])
  .map((entry) => entry.id)
