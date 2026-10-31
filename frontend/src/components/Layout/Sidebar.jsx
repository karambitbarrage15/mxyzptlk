import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: '/explorer',
    label: 'Forecast Explorer',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    to: '/accuracy',
    label: 'Accuracy Analysis',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    to: '/decisions',
    label: 'Decision Support',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-[#121212] border-r border-[#242424] flex flex-col h-screen shrink-0">
      {/* Supabase Brand Header */}
      <div className="p-5 border-b border-[#242424]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#171717] border border-[#282828] flex items-center justify-center text-[#3ECF8E] shadow-sm">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M21.362 9.354H12V.3a.3.3 0 0 0-.535-.195L2.348 12.982a.3.3 0 0 0 .235.492H12v9.054a.3.3 0 0 0 .535.195l9.117-12.877a.3.3 0 0 0-.235-.492z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              WindSight
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-[#3ECF8E] border border-emerald-500/20">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500 font-mono tracking-wide">UK Day-Ahead Desk</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
          Platform
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#1c1c1c] text-[#3ECF8E] border border-[#2e2e2e]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#181818]'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Supabase Status Footer */}
      <div className="p-3.5 border-t border-[#242424] bg-[#121212]">
        <div className="p-2.5 rounded-md bg-[#171717] border border-[#262626]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-zinc-300">Elexon Stream</span>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#3ECF8E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3ECF8E] animate-pulse" />
              Connected
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono">Jan 2026 • 1,488 HH Periods</p>
        </div>
      </div>
    </aside>
  )
}
