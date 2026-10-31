import Plot from '../Common/Plot'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function ForecastActualChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-zinc-500 text-xs font-mono">Loading outturn vs forecast streams...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="card flex items-center justify-center h-96">
        <p className="text-zinc-500 text-sm font-mono">No forecast vs actual data available</p>
      </div>
    )
  }

  const traces = [
    {
      x: data.timestamps,
      y: data.actuals,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Outturn (FUELHH)',
      line: { color: '#3ECF8E', width: 2 },
      hovertemplate: '<b>Actual Outturn</b><br>%{x}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
    {
      x: data.timestamps,
      y: data.forecasts,
      type: 'scatter',
      mode: 'lines',
      name: 'Latest Forecast (WINDFOR)',
      line: { color: '#38BDF8', width: 1.5, dash: 'solid' },
      hovertemplate: '<b>Wind Forecast</b><br>%{x}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
  ]

  // Add subtle error band
  if (data.actuals && data.forecasts) {
    traces.push({
      x: [...data.timestamps, ...[...data.timestamps].reverse()],
      y: [...data.actuals, ...[...data.forecasts].reverse()],
      fill: 'toself',
      fillcolor: 'rgba(62, 207, 142, 0.07)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: 'Volumetric Error Gap',
      showlegend: true,
      hoverinfo: 'skip',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    height: 400,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#242424]">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            National Wind Generation: Outturn vs Day-Ahead Forecast
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Half-hourly settlement periods for Great Britain (January 2026)
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#282828] text-zinc-300">
            <span className="w-2 h-0.5 bg-[#3ECF8E] inline-block" /> Actual
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#282828] text-zinc-300">
            <span className="w-2 h-0.5 bg-[#38BDF8] inline-block" /> Forecast
          </span>
        </div>
      </div>
      <div className="w-full">
        <Plot data={traces} layout={layout} config={plotlyConfig} useResizeHandler className="w-full" />
      </div>
    </div>
  )
}
