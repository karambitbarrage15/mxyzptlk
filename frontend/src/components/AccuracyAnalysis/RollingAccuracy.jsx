import Plot from '../Common/Plot'
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
        <p className="text-zinc-500 text-xs font-mono">No rolling accuracy data available</p>
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
      line: { color: '#3ECF8E', width: 2 },
      fill: 'tozeroy',
      fillcolor: 'rgba(62, 207, 142, 0.08)',
      hovertemplate: '<b>%{x}</b><br>RMSE: <b>%{y:.1f} MW</b><extra></extra>',
    },
  ]

  const layout = {
    ...plotlyDarkLayout,
    height: 310,
    title: {
      text: '7-Day Rolling Error Trajectory',
      font: { color: '#ededed', size: 12 },
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Date', font: { size: 10, color: '#8b949e' } },
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'RMSE (MW)', font: { size: 10, color: '#8b949e' } },
      rangemode: 'tozero',
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
