import Plot from 'react-plotly.js'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function ErrorHeatmap({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-80">
        <div className="spinner" />
      </div>
    )
  }

  if (!data || !data.hours || data.hours.length === 0) {
    return (
      <div className="card flex items-center justify-center h-80">
        <p className="text-gray-500 text-sm">No hourly error data available</p>
      </div>
    )
  }

  // Color the bars based on error magnitude and direction
  const colors = data.mean_error?.map((v) => {
    if (v > 100) return '#ef4444'
    if (v > 0) return '#f97316'
    if (v > -100) return '#06b6d4'
    return '#3b82f6'
  })

  const traces = [
    {
      x: data.hours,
      y: data.mean_error,
      type: 'bar',
      name: 'Mean Error',
      marker: {
        color: colors,
        opacity: 0.85,
      },
      hovertemplate: '<b>Hour %{x}:00</b><br>Mean Error: %{y:.1f} MW<extra></extra>',
    },
  ]

  // Add MAE line if available
  if (data.mae) {
    traces.push({
      x: data.hours,
      y: data.mae,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'MAE',
      line: { color: '#a855f7', width: 2 },
      marker: { size: 5 },
      yaxis: 'y2',
      hovertemplate: '<b>Hour %{x}:00</b><br>MAE: %{y:.1f} MW<extra></extra>',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    title: {
      text: 'Error by Hour of Day',
      font: { color: '#e5e7eb', size: 14 },
      x: 0,
      xanchor: 'left',
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Hour of Day', font: { color: '#9ca3af', size: 11 } },
      dtick: 2,
      tick0: 0,
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Mean Error (MW)', font: { color: '#9ca3af', size: 11 } },
    },
    yaxis2: data.mae ? {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'MAE (MW)', font: { color: '#a855f7', size: 11 } },
      overlaying: 'y',
      side: 'right',
      gridcolor: 'transparent',
    } : undefined,
    legend: {
      ...plotlyDarkLayout.legend,
      orientation: 'h',
      y: 1.12,
    },
    height: 320,
    bargap: 0.1,
    shapes: [
      {
        type: 'line',
        x0: -0.5,
        x1: 23.5,
        y0: 0,
        y1: 0,
        line: { color: '#6b7280', width: 1, dash: 'dash' },
      },
    ],
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
