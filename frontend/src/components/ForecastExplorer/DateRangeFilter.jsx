export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange }) {
  return (
    <div className="card-compact flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
          <svg className="w-4 h-4 text-[#3ECF8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Date Filter:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] text-zinc-500 uppercase font-mono">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="bg-[#141414] border border-[#2a2a2a] rounded-md px-2.5 py-1 text-xs text-zinc-200 font-mono focus:border-[#3ECF8E] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] text-zinc-500 uppercase font-mono">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="bg-[#141414] border border-[#2a2a2a] rounded-md px-2.5 py-1 text-xs text-zinc-200 font-mono focus:border-[#3ECF8E] focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]"
          />
        </div>
      </div>

      <div className="flex gap-1.5">
        {[
          { label: '1 Day', days: 1 },
          { label: '1 Week', days: 7 },
          { label: '2 Weeks', days: 14 },
          { label: 'All Month', days: null },
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
            className="px-2.5 py-1 text-[11px] font-mono rounded-md bg-[#1c1c1c] text-zinc-300 hover:text-white hover:bg-[#252525] border border-[#2a2a2a] hover:border-[#383838] transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
