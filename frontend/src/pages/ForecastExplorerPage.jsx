import { useState, useMemo } from 'react'
import { useForecastVsActual } from '../hooks/useApi'
import DateRangeFilter from '../components/ForecastExplorer/DateRangeFilter'
import TimeSeriesChart from '../components/ForecastExplorer/TimeSeriesChart'
import { formatMW } from '../utils/formatters'

export default function ForecastExplorerPage() {
  const [startDate, setStartDate] = useState('2026-01-01')
  const [endDate, setEndDate] = useState('2026-01-31')

  const { data: vsActualData, isLoading, error } = useForecastVsActual()

  // Filter dataset by selected date range
  const filteredData = useMemo(() => {
    if (!vsActualData?.data) return null

    const start = new Date(`${startDate}T00:00:00Z`).getTime()
    const end = new Date(`${endDate}T23:59:59Z`).getTime()

    const records = vsActualData.data.filter((item) => {
      const t = new Date(item.startTime).getTime()
      return t >= start && t <= end
    })

    if (records.length === 0) return null

    const timestamps = records.map((r) => r.startTime)
    const actuals = records.map((r) => r.actual)
    const forecasts = records.map((r) => r.forecast)
    const errors = records.map((r) => r.error)

    // Compute period-specific stats
    const absErrors = errors.map((e) => Math.abs(e))
    const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length
    const rmse = Math.sqrt(errors.reduce((a, b) => a + b * b, 0) / errors.length)
    const bias = errors.reduce((a, b) => a + b, 0) / errors.length
    const maxAct = Math.max(...actuals)
    const minAct = Math.min(...actuals)

    return {
      timestamps,
      actuals,
      forecasts,
      stats: {
        periods: records.length,
        mae,
        rmse,
        bias,
        maxActual: maxAct,
        minActual: minAct,
      },
    }
  }, [vsActualData, startDate, endDate])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#242424]">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Forecast Explorer</h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Granular time-series inspection with dynamic error spreads
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
      />

      {/* Filtered Range Quick Stats */}
      {filteredData?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="card-compact">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Selected Periods</span>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {filteredData.stats.periods}{' '}
              <span className="text-[11px] font-normal text-zinc-500">
                ({(filteredData.stats.periods / 2).toFixed(1)} hrs)
              </span>
            </div>
          </div>
          <div className="card-compact">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Range MAE</span>
            <div className="text-lg font-bold text-[#38BDF8] mt-1 font-mono">
              {formatMW(filteredData.stats.mae, 1)}
            </div>
          </div>
          <div className="card-compact">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Range RMSE</span>
            <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
              {formatMW(filteredData.stats.rmse, 1)}
            </div>
          </div>
          <div className="card-compact">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Range Bias</span>
            <div
              className={`text-lg font-bold mt-1 font-mono ${
                Math.abs(filteredData.stats.bias) < 500 ? 'text-[#3ECF8E]' : 'text-amber-400'
              }`}
            >
              {filteredData.stats.bias > 0 ? `+${filteredData.stats.bias.toFixed(1)}` : filteredData.stats.bias.toFixed(1)} MW
            </div>
          </div>
          <div className="card-compact">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">Peak Actual Wind</span>
            <div className="text-lg font-bold text-[#3ECF8E] mt-1 font-mono">
              {formatMW(filteredData.stats.maxActual, 0)}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-950/30 border border-rose-800/50 rounded-md text-rose-300 text-xs font-mono">
          Failed to load data: {error.message}
        </div>
      )}

      {/* Interactive TimeSeries Chart */}
      <TimeSeriesChart data={filteredData} isLoading={isLoading} />
    </div>
  )
}
