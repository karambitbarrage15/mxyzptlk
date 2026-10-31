import { useMetrics, useForecastVsActual } from '../hooks/useApi'
import KPICards from '../components/Dashboard/KPICards'
import ForecastActualChart from '../components/Dashboard/ForecastActualChart'
import SummaryTable from '../components/Dashboard/SummaryTable'

export default function DashboardPage() {
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useMetrics()
  const { data: vsActualData, isLoading: vsActualLoading, error: vsActualError } = useForecastVsActual()

  // Format data for ForecastActualChart & SummaryTable
  const chartData = vsActualData?.data
    ? {
        timestamps: vsActualData.data.map((d) => d.startTime),
        actuals: vsActualData.data.map((d) => d.actual),
        forecasts: vsActualData.data.map((d) => d.forecast),
      }
    : null

  const metrics = metricsData?.metrics

  return (
    <div className="space-y-6">
      {/* Supabase-style Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242424]">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Overview</h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Elexon BMRS Wind Power Actuals (FUELHH) vs Forecasts (WINDFOR) • January 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-supabase font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
            Live Feed Verified
          </span>
          <span className="text-[11px] font-mono text-zinc-400 border border-[#282828] bg-[#171717] rounded-md px-2.5 py-1">
            1,488 Periods
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards metrics={metrics} isLoading={metricsLoading} />

      {/* Error state */}
      {(metricsError || vsActualError) && (
        <div className="p-3.5 bg-rose-950/30 border border-rose-800/50 rounded-md text-rose-300 text-xs font-mono">
          Failed to load live data: {metricsError?.message || vsActualError?.message}
        </div>
      )}

      {/* Main Forecast vs Actual Chart */}
      <ForecastActualChart data={chartData} isLoading={vsActualLoading} />

      {/* Summary Table */}
      <SummaryTable data={chartData} isLoading={vsActualLoading} />
    </div>
  )
}
