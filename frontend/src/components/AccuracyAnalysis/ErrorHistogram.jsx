import Plot from '../Common/Plot'
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
        <p className="text-zinc-500 text-xs font-mono">No error distribution data available</p>
      </div>
    )
  }

  const traces = []

  // Pre-binned data
  if (data.bin_edges && data.counts) {
    const binCenters = []
    for (let i = 0; i < data.bin_edges.length - 1; i++) {
      binCenters.push((data.bin_edges[i] + data.bin_edges[i + 1]) / 2)
    }
    traces.push({
      x: binCenters,
      y: data.counts,
      type: 'bar',
      name: 'Distribution',
      marker: {
        color: 'rgba(62, 207, 142, 0.65)',
        line: { color: '#3ECF8E', width: 1 },
      },
      hovertemplate: '<b>Residual: %{x:.0f} MW</b><br>Count: %{y} periods<extra></extra>',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    height: 310,
    title: {
      text: 'Error Frequency Distribution',
      font: { color: '#ededed', size: 12 },
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Forecast Error (MW)', font: { size: 10, color: '#8b949e' } },
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Frequency', font: { size: 10, color: '#8b949e' } },
    },
  }

  return (
    <div className="card">
      <div className="w-full">
        <Plot data={traces} layout={layout} config={plotlyConfig} useResizeHandler className="w-full" />
      </div>
    </div>
  )
}
