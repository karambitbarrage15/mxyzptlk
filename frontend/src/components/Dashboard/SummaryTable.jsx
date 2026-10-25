import { formatMW, formatDateTime } from '../../utils/formatters'

export default function SummaryTable({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Recent Data Summary</h3>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Recent Data Summary</h3>
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  // Show the most recent 20 entries
  const count = Math.min(20, data.timestamps.length)
  const startIdx = data.timestamps.length - count

  const rows = []
  for (let i = data.timestamps.length - 1; i >= startIdx; i--) {
    const forecast = data.forecasts?.[i]
    const actual = data.actuals?.[i]
    const error = forecast != null && actual != null ? forecast - actual : null
    const absError = error != null ? Math.abs(error) : null

    rows.push({
      timestamp: data.timestamps[i],
      forecast,
      actual,
      error,
      absError,
    })
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Recent Data Summary</h3>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Forecast</th>
              <th>Actual</th>
              <th>Error</th>
              <th>Abs Error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="text-gray-300">
                <td className="font-mono text-xs">{formatDateTime(row.timestamp)}</td>
                <td className="text-blue-400">{formatMW(row.forecast, 0)}</td>
                <td className="text-emerald-400">{formatMW(row.actual, 0)}</td>
                <td className={
                  row.error == null ? 'text-gray-500' :
                  row.error > 0 ? 'text-orange-400' : 'text-cyan-400'
                }>
                  {row.error != null ? `${row.error > 0 ? '+' : ''}${row.error.toFixed(0)} MW` : '—'}
                </td>
                <td className="text-gray-300">{formatMW(row.absError, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
