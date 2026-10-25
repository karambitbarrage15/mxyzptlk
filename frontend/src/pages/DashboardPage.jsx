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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            UK National Wind Generation Outturn vs Elexon WINDFOR Forecasts &bull; January 2026 Evaluation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Elexon BMRS Stream Active
          </span>
          <span className="text-xs text-gray-500 border border-gray-800 rounded-lg px-2.5 py-1">
            1,488 Settlement Periods
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards metrics={metrics} isLoading={metricsLoading} />

      {/* Error state */}
      {(metricsError || vsActualError) && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-200 text-sm">
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
