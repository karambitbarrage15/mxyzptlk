import { useState } from 'react'
import { formatMW, formatDateTime, formatTime } from '../../utils/formatters'

export default function LatestForecastPanel({ forecasts, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Latest Available Forecasts</h3>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-700/50 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const items = forecasts || []
  const filtered = items.filter((item) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      item.startTime.toLowerCase().includes(term) ||
      item.publishTime.toLowerCase().includes(term) ||
      String(item.generation).includes(term)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-200">Latest Available Forecasts</h3>
          <p className="text-xs text-gray-400 mt-1">
            Most recent forecast revision per half-hour settlement period
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search date/time..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {filtered.length} periods
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Target Period (Delivery)</th>
              <th>Published At</th>
              <th>Lead Time</th>
              <th>Forecast (MW)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-500 py-8">
                  No forecasts found
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => {
                const start = new Date(item.startTime)
                const pub = new Date(item.publishTime)
                const leadHours = Math.max(0, (start - pub) / (1000 * 60 * 60)).toFixed(1)

                return (
                  <tr key={idx}>
                    <td className="font-mono text-xs text-gray-200">
                      {formatDateTime(item.startTime)}
                    </td>
                    <td className="font-mono text-xs text-gray-400">
                      {formatDateTime(item.publishTime)}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                        {leadHours}h ahead
                      </span>
                    </td>
                    <td className="font-mono font-semibold text-blue-400">
                      {formatMW(item.generation)}
                    </td>
                    <td>
                      {item.generation > 12000 ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          High Wind
                        </span>
                      ) : item.generation > 6000 ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                          Moderate Wind
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                          Low Wind
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800 text-xs text-gray-400">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-300 border border-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-gray-300 border border-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
