import Plot from 'react-plotly.js'
import { plotlyDarkLayout, plotlyConfig, formatMW } from '../../utils/formatters'

export default function ConfidenceBands({ forecasts, metrics, errorStats, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <div className="spinner" />
      </div>
    )
  }

  if (!forecasts || forecasts.length === 0) {
    return (
      <div className="card flex items-center justify-center h-96">
        <p className="text-gray-500">No forecast data available for confidence analysis</p>
      </div>
    )
  }

  // Use historical RMSE / std to compute P10, P50, P90 confidence bands
  // In normal distribution: P10 is approx forecast - 1.282 * rmse, P90 is forecast + 1.282 * rmse
  const stdError = errorStats?.std || metrics?.rmse || 850
  const zScore90 = 1.282 // 80% interval (P10 to P90)
  const zScore95 = 1.960 // 95% interval

  const timestamps = forecasts.map((f) => f.startTime)
  const baseForecasts = forecasts.map((f) => f.generation)

  // P10: Lower bound (conservative generation available)
  const p10Band = baseForecasts.map((f) => Math.max(0, f - zScore90 * stdError))
  // P90: Upper bound
  const p90Band = baseForecasts.map((f) => f + zScore90 * stdError)
  // P05 & P95 for wider band
  const p05Band = baseForecasts.map((f) => Math.max(0, f - zScore95 * stdError))
  const p95Band = baseForecasts.map((f) => f + zScore95 * stdError)

  const traces = [
    // 95% Confidence Band (Outer)
    {
      x: [...timestamps, ...[...timestamps].reverse()],
      y: [...p95Band, ...[...p05Band].reverse()],
      fill: 'toself',
      fillcolor: 'rgba(59, 130, 246, 0.08)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: '95% Confidence Interval (P05-P95)',
      hoverinfo: 'skip',
    },
    // 80% Confidence Band (P10 - P90)
    {
      x: [...timestamps, ...[...timestamps].reverse()],
      y: [...p90Band, ...[...p10Band].reverse()],
      fill: 'toself',
      fillcolor: 'rgba(59, 130, 246, 0.18)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: '80% Confidence Interval (P10-P90)',
      hoverinfo: 'skip',
    },
    // Base Forecast Line (P50)
    {
      x: timestamps,
      y: baseForecasts,
      type: 'scatter',
      mode: 'lines',
      name: 'Forecast (P50 Expected)',
      line: { color: '#3b82f6', width: 2.5 },
      hovertemplate: '<b>%{x}</b><br>Forecast: %{y:.0f} MW<extra></extra>',
    },
    // P10 Line (Conservative Buffer Limit)
    {
      x: timestamps,
      y: p10Band,
      type: 'scatter',
      mode: 'lines',
      name: 'P10 Floor (90% Confident Wind Exceeds)',
      line: { color: '#f59e0b', width: 1.5, dash: 'dot' },
      hovertemplate: '<b>P10 Floor</b><br>%{y:.0f} MW<extra></extra>',
    },
  ]

  const layout = {
    ...plotlyDarkLayout,
    title: {
      text: 'Day-Ahead Wind Forecast with Probabilistic Confidence Bands (MW)',
      font: { color: '#f3f4f6', size: 15 },
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: 'Settlement Period Delivery Time',
      type: 'date',
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: 'Wind Generation (MW)',
      rangemode: 'tozero',
    },
    height: 440,
    legend: {
      orientation: 'h',
      y: -0.22,
      x: 0,
      font: { color: '#9ca3af', size: 11 },
    },
  }

  const avgBuffer = (zScore90 * stdError).toFixed(0)

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-200">Probabilistic Forecast & Procurement Bounds</h3>
          <p className="text-xs text-gray-400 mt-1">
            Quantified uncertainty bands calibrated on January 2026 forecast error distribution (RMSE: {stdError.toFixed(0)} MW)
          </p>
        </div>
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs">
          <span className="text-amber-400 font-semibold">Recommended Thermal Buffer:</span>
          <span className="font-mono text-gray-200 font-bold">+{avgBuffer} MW</span>
        </div>
      </div>

      <div className="w-full">
        <Plot data={traces} layout={layout} config={plotlyConfig} useResizeHandler className="w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800 text-xs">
        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <span className="font-semibold text-amber-400 block mb-1">P10 Conservative Bound</span>
          <p className="text-gray-400">
            90% probability that actual wind will deliver at or above this level. Use this line to calculate minimum thermal baseline contracts.
          </p>
        </div>
        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <span className="font-semibold text-blue-400 block mb-1">P50 Expected Mean</span>
          <p className="text-gray-400">
            Official Elexon WINDFOR point forecast. Represents the mathematical expectation of generation across the system.
          </p>
        </div>
        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <span className="font-semibold text-emerald-400 block mb-1">Surplus Risk Mitigation</span>
          <p className="text-gray-400">
            If actual generation hits P90, avoid costly day-ahead over-hedging penalties by keeping flexibility in short-term balancing options.
          </p>
        </div>
      </div>
    </div>
  )
}
