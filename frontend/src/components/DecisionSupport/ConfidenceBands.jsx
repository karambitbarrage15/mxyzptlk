import Plot from '../Common/Plot'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

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
        <p className="text-zinc-500 text-xs font-mono">No forecast data available for confidence analysis</p>
      </div>
    )
  }

  const stdError = errorStats?.std || metrics?.rmse || 850
  const zScore90 = 1.282 // 80% interval (P10 to P90)
  const zScore95 = 1.960 // 95% interval

  const timestamps = forecasts.map((f) => f.startTime)
  const baseForecasts = forecasts.map((f) => f.generation)

  const p10Band = baseForecasts.map((f) => Math.max(0, f - zScore90 * stdError))
  const p90Band = baseForecasts.map((f) => f + zScore90 * stdError)
  const p05Band = baseForecasts.map((f) => Math.max(0, f - zScore95 * stdError))
  const p95Band = baseForecasts.map((f) => f + zScore95 * stdError)

  const traces = [
    // 95% Confidence Band (Outer)
    {
      x: [...timestamps, ...[...timestamps].reverse()],
      y: [...p95Band, ...[...p05Band].reverse()],
      fill: 'toself',
      fillcolor: 'rgba(62, 207, 142, 0.05)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: '95% Interval (P05-P95)',
      hoverinfo: 'skip',
    },
    // 80% Confidence Band (P10 - P90)
    {
      x: [...timestamps, ...[...timestamps].reverse()],
      y: [...p90Band, ...[...p10Band].reverse()],
      fill: 'toself',
      fillcolor: 'rgba(62, 207, 142, 0.12)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: '80% Interval (P10-P90)',
      hoverinfo: 'skip',
    },
    // Base Forecast Line (P50)
    {
      x: timestamps,
      y: baseForecasts,
      type: 'scatter',
      mode: 'lines',
      name: 'Forecast (P50 Expected)',
      line: { color: '#38BDF8', width: 2 },
      hovertemplate: '<b>P50 Forecast</b><br>%{x}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
    // P10 Line (Conservative Buffer Limit)
    {
      x: timestamps,
      y: p10Band,
      type: 'scatter',
      mode: 'lines',
      name: 'P10 Conservative Floor',
      line: { color: '#F5A623', width: 1.5, dash: 'dot' },
      hovertemplate: '<b>P10 Floor</b><br>%{x}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
  ]

  const layout = {
    ...plotlyDarkLayout,
    height: 420,
    title: {
      text: 'Day-Ahead Probabilistic Forecast Trajectory (MW)',
      font: { color: '#ededed', size: 13 },
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      type: 'date',
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Generation (MW)', font: { size: 10, color: '#8b949e' } },
      rangemode: 'tozero',
    },
    legend: {
      orientation: 'h',
      y: 1.12,
      x: 0,
      font: { color: '#ededed', size: 10 },
    },
  }

  const avgBuffer = (zScore90 * stdError).toFixed(0)

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#242424]">
        <div>
          <h3 className="text-sm font-semibold text-white">Probabilistic Bounds & Risk Envelopes</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Calibrated on January 2026 forecast variance (σ = {stdError.toFixed(0)} MW)
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#1c1c1c] border border-amber-500/30 rounded-md px-2.5 py-1 text-xs font-mono">
          <span className="text-amber-400 font-medium">Reserve Buffer (P10):</span>
          <span className="text-white font-bold font-mono">+{avgBuffer} MW</span>
        </div>
      </div>

      <div className="w-full">
        <Plot data={traces} layout={layout} config={plotlyConfig} useResizeHandler className="w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4 pt-3.5 border-t border-[#242424] text-xs font-mono">
        <div className="p-3 bg-[#141414] rounded-md border border-[#242424]">
          <span className="font-semibold text-amber-400 block mb-1">P10 Conservative Floor</span>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            90% statistical confidence that wind generation will meet or exceed this level. Used for baseline thermal commit.
          </p>
        </div>
        <div className="p-3 bg-[#141414] rounded-md border border-[#242424]">
          <span className="font-semibold text-[#38BDF8] block mb-1">P50 Expected Mean</span>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            Official WINDFOR point prediction. Represents the mean mathematical expectation across all GB wind assets.
          </p>
        </div>
        <div className="p-3 bg-[#141414] rounded-md border border-[#242424]">
          <span className="font-semibold text-[#3ECF8E] block mb-1">P90 Upside Cap</span>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            High-generation scenario. Protects desk from thermal over-hedging and negative imbalance cash-out prices.
          </p>
        </div>
      </div>
    </div>
  )
}
