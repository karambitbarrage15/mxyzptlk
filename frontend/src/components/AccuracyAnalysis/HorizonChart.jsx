import Plot from 'react-plotly.js'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function HorizonChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-80">
        <div className="spinner" />
      </div>
    )
  }

  if (!data || !data.hours_ahead || data.hours_ahead.length === 0) {
    return (
      <div className="card flex items-center justify-center h-80">
        <p className="text-gray-500 text-sm">No horizon analysis data available</p>
      </div>
    )
  }

  const traces = [
    {
      x: data.hours_ahead,
      y: data.rmse,
      type: 'bar',
      name: 'RMSE',
      marker: {
        color: data.rmse?.map((v) =>
          v < 300 ? '#10b981' : v < 500 ? '#f59e0b' : '#ef4444'
        ),
        opacity: 0.85,
      },
      hovertemplate: '<b>%{x}h ahead</b><br>RMSE: %{y:.1f} MW<extra></extra>',
    },
  ]

  if (data.mae) {
    traces.push({
      x: data.hours_ahead,
      y: data.mae,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'MAE',
      line: { color: '#3b82f6', width: 2 },
      marker: { size: 6 },
      hovertemplate: '<b>%{x}h ahead</b><br>MAE: %{y:.1f} MW<extra></extra>',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    title: {
      text: 'Forecast Accuracy by Lead Time',
      font: { color: '#e5e7eb', size: 14 },
      x: 0,
      xanchor: 'left',
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Hours Ahead', font: { color: '#9ca3af', size: 11 } },
      dtick: data.hours_ahead.length > 20 ? 4 : 1,
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Error (MW)', font: { color: '#9ca3af', size: 11 } },
    },
    legend: {
      ...plotlyDarkLayout.legend,
      orientation: 'h',
      y: 1.12,
    },
    height: 320,
    bargap: 0.15,
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
