import Plot from '../Common/Plot'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function TimeSeriesChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-[460px]">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-zinc-500 text-xs font-mono">Filtering settlement periods...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="card flex items-center justify-center h-[460px]">
        <p className="text-zinc-500 text-xs font-mono">No data found for this date range.</p>
      </div>
    )
  }

  // Compute error band
  const upperBound = []
  const lowerBound = []
  for (let i = 0; i < data.timestamps.length; i++) {
    const f = data.forecasts?.[i]
    const a = data.actuals?.[i]
    if (f != null && a != null) {
      upperBound.push(Math.max(f, a))
      lowerBound.push(Math.min(f, a))
    } else {
      upperBound.push(f ?? a ?? null)
      lowerBound.push(f ?? a ?? null)
    }
  }

  const traces = [
    // Error band fill
    {
      x: [...data.timestamps, ...[...data.timestamps].reverse()],
      y: [...upperBound, ...[...lowerBound].reverse()],
      fill: 'toself',
      fillcolor: 'rgba(62, 207, 142, 0.08)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: 'Variance Band',
      showlegend: true,
      hoverinfo: 'skip',
    },
    // Actual outturn line
    {
      x: data.timestamps,
      y: data.actuals,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Outturn',
      line: { color: '#3ECF8E', width: 2 },
      hovertemplate: '<b>Actual Outturn</b><br>%{x}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
    // Forecast line
    {
      x: data.timestamps,
      y: data.forecasts,
      type: 'scatter',
      mode: 'lines',
      name: 'Wind Forecast',
      line: { color: '#38BDF8', width: 1.5 },
      hovertemplate: '<b>Wind Forecast</b><br>%{x}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
  ]

  const layout = {
    ...plotlyDarkLayout,
    height: 440,
    margin: { l: 55, r: 25, t: 30, b: 40 },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      type: 'date',
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Generation (MW)', font: { size: 11, color: '#8b949e' } },
      rangemode: 'tozero',
    },
    legend: {
      orientation: 'h',
      y: 1.1,
      x: 0,
      font: { color: '#ededed', size: 11 },
    },
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#242424]">
        <div>
          <h2 className="text-sm font-semibold text-white">Interactive Zoom & Pan Explorer</h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Click and drag horizontally across the chart to zoom into specific days</p>
        </div>
      </div>
      <div className="w-full">
        <Plot data={traces} layout={layout} config={plotlyConfig} useResizeHandler className="w-full" />
      </div>
    </div>
  )
}
