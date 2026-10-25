import Plot from 'react-plotly.js'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function TimeSeriesChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-[500px]">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading time series data...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="card flex items-center justify-center h-[500px]">
        <p className="text-gray-500">No data available for the selected range. Try adjusting the date filter.</p>
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
      fillcolor: 'rgba(249, 115, 22, 0.12)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: 'Error Band',
      showlegend: true,
      hoverinfo: 'skip',
    },
    // Actual generation
    {
      x: data.timestamps,
      y: data.actuals,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Generation',
      line: { color: '#10b981', width: 2 },
      hovertemplate: '<b>Actual</b><br>%{x|%d %b %Y %H:%M}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
    // Forecast
    {
      x: data.timestamps,
      y: data.forecasts,
      type: 'scatter',
      mode: 'lines',
      name: 'Forecast',
      line: { color: '#3b82f6', width: 2 },
      hovertemplate: '<b>Forecast</b><br>%{x|%d %b %Y %H:%M}<br><b>%{y:.0f} MW</b><extra></extra>',
    },
  ]

  const layout = {
    ...plotlyDarkLayout,
    title: {
      text: 'Interactive Forecast vs Actual Explorer',
      font: { color: '#e5e7eb', size: 16 },
      x: 0,
      xanchor: 'left',
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Date / Time', font: { color: '#9ca3af' } },
      type: 'date',
      rangeslider: { visible: true, bgcolor: '#111827', bordercolor: '#374151' },
      rangeselector: {
        buttons: [
          { count: 1, label: '1D', step: 'day', stepmode: 'backward' },
          { count: 7, label: '1W', step: 'day', stepmode: 'backward' },
          { count: 14, label: '2W', step: 'day', stepmode: 'backward' },
          { step: 'all', label: 'All' },
        ],
        bgcolor: '#1f2937',
        activecolor: '#3b82f6',
        bordercolor: '#4b5563',
        font: { color: '#d1d5db' },
      },
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Generation (MW)', font: { color: '#9ca3af' } },
    },
    legend: {
      ...plotlyDarkLayout.legend,
      orientation: 'h',
      y: 1.15,
      x: 0.5,
      xanchor: 'center',
    },
    height: 550,
    dragmode: 'zoom',
  }

  return (
    <div className="card">
      <Plot
        data={traces}
        layout={layout}
        config={{ ...plotlyConfig, scrollZoom: true }}
        className="w-full"
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
