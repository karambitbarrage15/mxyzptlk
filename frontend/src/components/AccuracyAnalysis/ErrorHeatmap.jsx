import Plot from '../Common/Plot'
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
        <p className="text-zinc-500 text-xs font-mono">No hourly error data available</p>
      </div>
    )
  }

  // Color the bars with Supabase palette
  const colors = data.mean_error?.map((v) => {
    if (v > 1000) return '#F87171'
    if (v > 0) return '#F5A623'
    if (v > -500) return '#3ECF8E'
    return '#38BDF8'
  })

  const traces = [
    {
      x: data.hours,
      y: data.mean_error,
      type: 'bar',
      name: 'Mean Error (Bias)',
      marker: {
        color: colors,
        opacity: 0.85,
      },
      hovertemplate: '<b>Hour %{x}:00</b><br>Mean Bias: <b>%{y:.1f} MW</b><extra></extra>',
    },
  ]

  // Add RMSE if available
  if (data.mae) {
    traces.push({
      x: data.hours,
      y: data.mae,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'RMSE',
      line: { color: '#38BDF8', width: 1.5, dash: 'dot' },
      marker: { size: 4, color: '#38BDF8' },
      hovertemplate: '<b>Hour %{x}:00</b><br>RMSE: <b>%{y:.1f} MW</b><extra></extra>',
    })
  }

  const layout = {
    ...plotlyDarkLayout,
    height: 310,
    title: {
      text: 'Diurnal Error Profile by Hour of Day',
      font: { color: '#ededed', size: 12 },
    },
    xaxis: {
      ...plotlyDarkLayout.xaxis,
      title: { text: 'Hour of Day (UTC)', font: { size: 10, color: '#8b949e' } },
      dtick: 2,
    },
    yaxis: {
      ...plotlyDarkLayout.yaxis,
      title: { text: 'MW Error', font: { size: 10, color: '#8b949e' } },
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
