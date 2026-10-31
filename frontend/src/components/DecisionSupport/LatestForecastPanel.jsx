import { useState } from 'react'
import { formatMW, formatDateTime } from '../../utils/formatters'

export default function LatestForecastPanel({ forecasts, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 12

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-3">Latest Forecast Publication Queue</h3>
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 bg-[#242424] rounded" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#242424]">
        <div>
          <h3 className="text-sm font-semibold text-white">Latest Forecast Publication Queue</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Most recent model revision published per settlement delivery period
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search timestamp..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="bg-[#141414] border border-[#2a2a2a] rounded-md px-2.5 py-1 text-xs text-zinc-200 font-mono focus:border-[#3ECF8E] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]"
          />
          <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap">
            {filtered.length} periods
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-[#262626]">
        <table>
          <thead>
            <tr>
              <th>Target Period</th>
              <th>Publish Time</th>
              <th>Lead Horizon</th>
              <th>Forecast (MW)</th>
              <th>Regime</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-zinc-500 py-6 font-mono text-xs">
                  No records matching filter
                </td>
              </tr>
            ) : (
              paginated.map((item, idx) => {
                const start = new Date(item.startTime)
                const pub = new Date(item.publishTime)
                const leadHours = Math.max(0, (start - pub) / (1000 * 60 * 60)).toFixed(1)

                return (
                  <tr key={idx} className="font-mono text-xs">
                    <td className="text-zinc-300 font-medium">
                      {formatDateTime(item.startTime)}
                    </td>
                    <td className="text-zinc-500">
                      {formatDateTime(item.publishTime)}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-[#141414] text-zinc-300 border border-[#2a2a2a]">
                        {leadHours}h
                      </span>
                    </td>
                    <td className="font-semibold text-[#38BDF8]">
                      {formatMW(item.generation)}
                    </td>
                    <td>
                      {item.generation > 12000 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-[#3ECF8E] border border-emerald-500/20 font-medium">
                          High
                        </span>
                      ) : item.generation > 6000 ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                          Normal
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                          Low
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
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#242424] text-xs font-mono text-zinc-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-supabase-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-supabase-secondary text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
