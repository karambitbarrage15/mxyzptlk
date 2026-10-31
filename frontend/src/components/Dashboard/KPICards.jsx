import { formatMW, formatPercent, formatNumber, getMetricColor } from '../../utils/formatters'

const metricConfig = [
  {
    key: 'mae',
    label: 'Mean Absolute Error',
    shortLabel: 'MAE',
    format: (v) => formatMW(v, 1),
    description: 'Average magnitude of error',
  },
  {
    key: 'rmse',
    label: 'Root Mean Square Error',
    shortLabel: 'RMSE',
    format: (v) => formatMW(v, 1),
    description: 'Penalizes large forecast spikes',
  },
  {
    key: 'mape',
    label: 'Mean Abs % Error',
    shortLabel: 'MAPE',
    format: (v) => formatPercent(v, 1),
    description: 'Relative percentage error',
  },
  {
    key: 'bias',
    label: 'Forecast Bias',
    shortLabel: 'BIAS',
    format: (v) => formatMW(v, 1),
    description: 'Systemic over / under-bias',
  },
  {
    key: 'max_absolute_error',
    fallbackKey: 'max_error',
    label: 'Maximum Error',
    shortLabel: 'MAX DELTA',
    format: (v) => formatMW(v, 0),
    description: 'Worst single settlement period',
  },
  {
    key: 'correlation',
    label: 'Pearson Correlation',
    shortLabel: 'R (CORR)',
    format: (v) => formatNumber(v, 4),
    description: 'Forecast vs outturn linearity',
  },
]

export default function KPICards({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-3 bg-[#242424] rounded w-14 mb-3" />
            <div className="h-7 bg-[#242424] rounded w-20 mb-2" />
            <div className="h-2.5 bg-[#242424] rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {metricConfig.map((metric) => {
        const value = metrics?.[metric.key] ?? metrics?.[metric.fallbackKey]
        const colorClass = getMetricColor(metric.key, value)

        return (
          <div key={metric.key} className="card group hover:border-[#383838]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">
                {metric.shortLabel}
              </span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  colorClass === 'text-[#3ECF8E]'
                    ? 'bg-[#3ECF8E] shadow-[0_0_6px_rgba(62,207,142,0.6)]'
                    : colorClass === 'text-amber-400'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
            </div>
            <div className={`kpi-value text-xl font-bold tracking-tight ${colorClass}`}>
              {value != null ? metric.format(value) : '—'}
            </div>
            <div className="kpi-label text-[11px] text-zinc-500 mt-1 font-mono">{metric.description}</div>
          </div>
        )
      })}
    </div>
  )
}
