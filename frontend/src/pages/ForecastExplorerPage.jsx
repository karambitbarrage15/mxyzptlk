import { useState, useMemo } from 'react'
import { useForecastVsActual } from '../hooks/useApi'
import DateRangeFilter from '../components/ForecastExplorer/DateRangeFilter'
import TimeSeriesChart from '../components/ForecastExplorer/TimeSeriesChart'
import { formatMW, formatPercent, formatNumber } from '../utils/formatters'

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
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Forecast Explorer</h1>
        <p className="text-sm text-gray-400 mt-1">
          Deep-dive into half-hourly settlement periods with interactive zoom, pan, and dynamic error bands
        </p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-compact">
            <span className="text-xs text-gray-500 uppercase">Selected Periods</span>
            <div className="text-xl font-bold text-white mt-1">
              {filteredData.stats.periods} <span className="text-xs font-normal text-gray-400">({(filteredData.stats.periods / 2).toFixed(1)} hrs)</span>
            </div>
          </div>
          <div className="card-compact">
            <span className="text-xs text-gray-500 uppercase">Range MAE</span>
            <div className="text-xl font-bold text-blue-400 mt-1">
              {formatMW(filteredData.stats.mae, 1)}
            </div>
          </div>
          <div className="card-compact">
            <span className="text-xs text-gray-500 uppercase">Range RMSE</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {formatMW(filteredData.stats.rmse, 1)}
            </div>
          </div>
          <div className="card-compact">
            <span className="text-xs text-gray-500 uppercase">Range Bias</span>
            <div className={`text-xl font-bold mt-1 ${filteredData.stats.bias > 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {filteredData.stats.bias > 0 ? `+${filteredData.stats.bias.toFixed(1)}` : filteredData.stats.bias.toFixed(1)} MW
            </div>
          </div>
          <div className="card-compact">
            <span className="text-xs text-gray-500 uppercase">Peak Actual Wind</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {formatMW(filteredData.stats.maxActual, 0)}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-200 text-sm">
          Failed to load data: {error.message}
        </div>
      )}

      {/* Interactive TimeSeries Chart */}
      <TimeSeriesChart data={filteredData} isLoading={isLoading} />
    </div>
  )
}
