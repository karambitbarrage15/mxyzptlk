import { useState } from 'react'

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div className="card-compact flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm text-gray-400 font-medium">Date Range:</span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 uppercase">From</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 uppercase">To</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 ml-auto">
        {[
          { label: '1 Day', days: 1 },
          { label: '1 Week', days: 7 },
          { label: '2 Weeks', days: 14 },
          { label: 'All', days: null },
        ].map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              if (preset.days === null) {
                onStartChange('2026-01-01')
                onEndChange('2026-01-31')
              } else {
                const end = new Date('2026-01-31')
                const start = new Date(end)
                start.setDate(start.getDate() - preset.days)
                onStartChange(start.toISOString().split('T')[0])
                onEndChange(end.toISOString().split('T')[0])
              }
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors border border-gray-600"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
