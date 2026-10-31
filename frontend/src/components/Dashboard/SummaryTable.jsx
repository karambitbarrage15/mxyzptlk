import { formatMW, formatDateTime } from '../../utils/formatters'

export default function SummaryTable({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Settlement Periods Audit Log</h3>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 bg-[#242424] rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!data || !data.timestamps || data.timestamps.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-2">Settlement Periods Audit Log</h3>
        <p className="text-zinc-500 text-xs font-mono">No data available</p>
      </div>
    )
  }

  // Show the most recent 15 entries
  const count = Math.min(15, data.timestamps.length)
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
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#242424]">
        <div>
          <h3 className="text-sm font-semibold text-white">Settlement Periods Audit Log</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Most recent 15 half-hourly market delivery periods</p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-[#1c1c1c] border border-[#282828]">
          Showing {rows.length} rows
        </span>
      </div>

      <div className="overflow-x-auto rounded border border-[#262626]">
        <table>
          <thead>
            <tr>
              <th>Delivery Start Time</th>
              <th>Actual Outturn</th>
              <th>Wind Forecast</th>
              <th>Residual Error</th>
              <th>Variance (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const pct = row.actual ? ((row.error / row.actual) * 100).toFixed(1) : 0
              return (
                <tr key={idx} className="font-mono text-xs">
                  <td className="text-zinc-300">{formatDateTime(row.timestamp)}</td>
                  <td className="font-semibold text-[#3ECF8E]">{formatMW(row.actual)}</td>
                  <td className="text-[#38BDF8]">{formatMW(row.forecast)}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                        row.error > 0
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-[#3ECF8E] border border-emerald-500/20'
                      }`}
                    >
                      {row.error > 0 ? `+${row.error.toFixed(0)}` : row.error.toFixed(0)} MW
                    </span>
                  </td>
                  <td className="text-zinc-400">{pct > 0 ? `+${pct}%` : `${pct}%`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
