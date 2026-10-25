import Plot from 'react-plotly.js'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function ForecastActualChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-96">
        <div className="text-center">
          <div className="spinner mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading chart data...</p>
        </div>
      </div>
    )
  }

  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="card flex items-center justify-center h-96">
        <p className="text-gray-500">No forecast vs actual data available</p>
      </div>
    )
  }

  const traces = [
    {
      x: data.timestamps,
      y: data.actuals,
      type: 'scatter',
      mode: 'lines',
      name: 'Actual Generation',
      line: { color: '#10b981', width: 1.5 },
      hovertemplate: '<b>Actual</b><br>%{x}<br>%{y:.0f} MW<extra></extra>',
    },
    {
      x: data.timestamps,
      y: data.forecasts,
      type: 'scatter',
      mode: 'lines',
      name: 'Forecast',
      line: { color: '#3b82f6', width: 1.5 },
      hovertemplate: '<b>Forecast</b><br>%{x}<br>%{y:.0f} MW<extra></extra>',
    },
  ]

  // Add error area if both exist
  if (data.actuals && data.forecasts) {
    traces.push({
      x: [...data.timestamps, ...[...data.timestamps].reverse()],
      y: [...data.actuals, ...[...data.forecasts].reverse()],
      fill: 'toself',
      fillcolor: 'rgba(249, 115, 22, 0.08)',
      line: { color: 'transparent' },
      type: 'scatter',
      name: 'Error Band',
      showlegend: false,
      hoverinfo: 'skip',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    title: {
      text: 'Forecast vs Actual Wind Generation — January 2026',
      font: { color: '#e5e7eb', size: 16 },
      x: 0,
      xanchor: 'left',
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Date', font: { color: '#9ca3af' } },
      type: 'date',
      rangeslider: { visible: true, bgcolor: '#111827', bordercolor: '#374151' },
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Generation (MW)', font: { color: '#9ca3af' } },
    },
    legend: {
      ...plotlyDarkLayout.legend,
      orientation: 'h',
      y: 1.12,
      x: 0.5,
      xanchor: 'center',
    },
    height: 450,
  }

  return (
    <div className="card">
      <Plot
        data={traces}
        layout={layout}
        config={plotlyConfig}
        className="w-full"
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
