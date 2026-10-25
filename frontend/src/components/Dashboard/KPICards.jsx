import { formatMW, formatPercent, formatNumber, getMetricColor } from '../../utils/formatters'

const metricConfig = [
  {
    key: 'mae',
    label: 'Mean Absolute Error',
    shortLabel: 'MAE',
    format: (v) => formatMW(v, 1),
    description: 'Average absolute deviation',
  },
  {
    key: 'rmse',
    label: 'Root Mean Square Error',
    shortLabel: 'RMSE',
    format: (v) => formatMW(v, 1),
    description: 'Penalizes large errors',
  },
  {
    key: 'mape',
    label: 'Mean Abs % Error',
    shortLabel: 'MAPE',
    format: (v) => formatPercent(v, 1),
    description: 'Percentage accuracy',
  },
  {
    key: 'bias',
    label: 'Forecast Bias',
    shortLabel: 'BIAS',
    format: (v) => formatMW(v, 1),
    description: 'Systematic over/under',
  },
  {
    key: 'max_error',
    label: 'Maximum Error',
    shortLabel: 'MAX ERR',
    format: (v) => formatMW(v, 0),
    description: 'Worst-case deviation',
  },
  {
    key: 'correlation',
    label: 'Correlation',
    shortLabel: 'CORR',
    format: (v) => formatNumber(v, 4),
    description: 'Forecast-actual R²',
  },
]

export default function KPICards({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-16 mb-3" />
            <div className="h-8 bg-gray-700 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricConfig.map((metric) => {
        const value = metrics?.[metric.key]
        const colorClass = getMetricColor(metric.key, value)

        return (
          <div key={metric.key} className="card hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {metric.shortLabel}
              </span>
              <div className={`w-2 h-2 rounded-full ${
                colorClass === 'text-emerald-400' ? 'bg-emerald-400' :
                colorClass === 'text-amber-400' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
            </div>
            <div className={`kpi-value ${colorClass}`}>
              {value != null ? metric.format(value) : '—'}
            </div>
            <div className="kpi-label">{metric.description}</div>
          </div>
        )
      })}
    </div>
  )
}
