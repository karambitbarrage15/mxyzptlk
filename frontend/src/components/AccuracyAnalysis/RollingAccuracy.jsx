import Plot from 'react-plotly.js'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function RollingAccuracy({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-80">
        <div className="spinner" />
      </div>
    )
  }

  if (!data || !data.dates || data.dates.length === 0) {
    return (
      <div className="card flex items-center justify-center h-80">
        <p className="text-gray-500 text-sm">No rolling accuracy data available</p>
      </div>
    )
  }

  const traces = [
    {
      x: data.dates,
      y: data.rolling_rmse,
      type: 'scatter',
      mode: 'lines',
      name: '7-Day Rolling RMSE',
      line: { color: '#3b82f6', width: 2.5 },
      fill: 'tozeroy',
      fillcolor: 'rgba(59, 130, 246, 0.1)',
      hovertemplate: '<b>%{x|%d %b %Y}</b><br>RMSE: %{y:.1f} MW<extra></extra>',
    },
  ]

  // Add rolling MAE if available
  if (data.rolling_mae) {
    traces.push({
      x: data.dates,
      y: data.rolling_mae,
      type: 'scatter',
      mode: 'lines',
      name: '7-Day Rolling MAE',
      line: { color: '#10b981', width: 2, dash: 'dash' },
      hovertemplate: '<b>%{x|%d %b %Y}</b><br>MAE: %{y:.1f} MW<extra></extra>',
    })
  }

  // Compute and show average line
  const avgRmse = data.rolling_rmse
    ? data.rolling_rmse.filter((v) => v != null).reduce((a, b) => a + b, 0) /
      data.rolling_rmse.filter((v) => v != null).length
    : null

  const layout = {
    ...plotlyDarkLayout,
    title: {
      text: 'Rolling 7-Day Forecast Accuracy',
      font: { color: '#e5e7eb', size: 14 },
      x: 0,
      xanchor: 'left',
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Date', font: { color: '#9ca3af', size: 11 } },
      type: 'date',
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'RMSE (MW)', font: { color: '#9ca3af', size: 11 } },
    },
    legend: {
      ...plotlyDarkLayout.legend,
      orientation: 'h',
      y: 1.12,
    },
    height: 320,
    shapes: avgRmse
      ? [
          {
            type: 'line',
            x0: data.dates[0],
            x1: data.dates[data.dates.length - 1],
            y0: avgRmse,
            y1: avgRmse,
            line: { color: '#f59e0b', width: 1.5, dash: 'dot' },
          },
        ]
      : [],
    annotations: avgRmse
      ? [
          {
            x: data.dates[data.dates.length - 1],
            y: avgRmse,
            text: `Avg: ${avgRmse.toFixed(0)} MW`,
            showarrow: false,
            font: { color: '#f59e0b', size: 11 },
            xanchor: 'right',
            bgcolor: '#1f2937',
            bordercolor: '#f59e0b',
            borderwidth: 1,
          },
        ]
      : [],
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
