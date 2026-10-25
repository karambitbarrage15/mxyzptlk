import Plot from 'react-plotly.js'
import { plotlyDarkLayout, plotlyConfig } from '../../utils/formatters'

export default function ErrorHistogram({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-80">
        <div className="spinner" />
      </div>
    )
  }

  if (!data || (!data.errors && !data.bin_edges)) {
    return (
      <div className="card flex items-center justify-center h-80">
        <p className="text-gray-500 text-sm">No error distribution data available</p>
      </div>
    )
  }

  const traces = []

  // If raw errors are provided, use histogram trace
  if (data.errors) {
    traces.push({
      x: data.errors,
      type: 'histogram',
      name: 'Error Distribution',
      marker: {
        color: 'rgba(59, 130, 246, 0.6)',
        line: { color: '#3b82f6', width: 1 },
      },
      nbinsx: data.num_bins || 50,
      hovertemplate: '<b>Error: %{x:.0f} MW</b><br>Count: %{y}<extra></extra>',
    })
  }

  // If pre-binned data, use bar chart
  if (data.bin_edges && data.counts) {
    const binCenters = []
    for (let i = 0; i < data.bin_edges.length - 1; i++) {
      binCenters.push((data.bin_edges[i] + data.bin_edges[i + 1]) / 2)
    }
    traces.push({
      x: binCenters,
      y: data.counts,
      type: 'bar',
      name: 'Error Distribution',
      marker: {
        color: 'rgba(59, 130, 246, 0.6)',
        line: { color: '#3b82f6', width: 1 },
      },
      width: data.bin_edges[1] - data.bin_edges[0],
      hovertemplate: '<b>Error: %{x:.0f} MW</b><br>Count: %{y}<extra></extra>',
    })
  }

  // Normal fit overlay if provided
  if (data.normal_fit_x && data.normal_fit_y) {
    traces.push({
      x: data.normal_fit_x,
      y: data.normal_fit_y,
      type: 'scatter',
      mode: 'lines',
      name: 'Normal Fit',
      line: { color: '#f97316', width: 2.5, dash: 'solid' },
      yaxis: data.bin_edges ? 'y' : 'y2',
      hovertemplate: '<b>Error: %{x:.0f} MW</b><br>Density: %{y:.4f}<extra></extra>',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    title: {
      text: 'Forecast Error Distribution',
      font: { color: '#e5e7eb', size: 14 },
      x: 0,
      xanchor: 'left',
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Forecast Error (MW)', font: { color: '#9ca3af', size: 11 } },
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Count', font: { color: '#9ca3af', size: 11 } },
    },
    legend: {
      ...plotlyDarkLayout.legend,
      orientation: 'h',
      y: 1.12,
    },
    height: 320,
    bargap: 0.02,
    shapes: [
      {
        type: 'line',
        x0: 0,
        x1: 0,
        y0: 0,
        y1: 1,
        yref: 'paper',
        line: { color: '#ef4444', width: 1.5, dash: 'dash' },
      },
    ],
    annotations: data.mean != null ? [
      {
        x: data.mean,
        y: 1,
        yref: 'paper',
        text: `Mean: ${data.mean?.toFixed(0)} MW`,
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowcolor: '#f97316',
        font: { color: '#f97316', size: 11 },
        bgcolor: '#1f2937',
        bordercolor: '#f97316',
        borderwidth: 1,
      },
    ] : [],
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
