import Plot from '../Common/Plot'
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
        <p className="text-zinc-500 text-xs font-mono">No horizon analysis data available</p>
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
          v < 1800 ? '#3ECF8E' : v < 2400 ? '#F5A623' : '#F87171'
        ),
        opacity: 0.85,
      },
      hovertemplate: '<b>%{x}h Lead Time</b><br>RMSE: <b>%{y:.1f} MW</b><extra></extra>',
    },
  ]

  if (data.mae) {
    traces.push({
      x: data.hours_ahead,
      y: data.mae,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'MAE',
      line: { color: '#38BDF8', width: 2 },
      marker: { size: 5, color: '#38BDF8' },
      hovertemplate: '<b>%{x}h Lead Time</b><br>MAE: <b>%{y:.1f} MW</b><extra></extra>',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    height: 310,
    title: {
      text: 'Error vs Lead Time Horizon',
      font: { color: '#ededed', size: 12 },
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Forecast Horizon (Hours Ahead)', font: { size: 10, color: '#8b949e' } },
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'Error (MW)', font: { size: 10, color: '#8b949e' } },
    },
    legend: {
      orientation: 'h',
      y: 1.15,
      x: 0,
      font: { color: '#ededed', size: 10 },
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
