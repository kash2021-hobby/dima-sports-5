import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react'

export type PlayerListItem = {
  id: string
  name: string
  team: string
  status: string
  avatar?: string | null
  phone?: string | null
  date?: string | null
}

const MOCK_PLAYERS: PlayerListItem[] = [
  { id: 'mock-1', name: 'Alex Johnson', team: 'Under-14 A', status: 'ACTIVE', avatar: null, phone: '+91 98765 43210', date: '2024-01-15T10:00:00Z' },
  { id: 'mock-2', name: 'Sam Williams', team: 'Under-16 B', status: 'ACTIVE', avatar: null, phone: '+91 91234 56789', date: '2024-01-24T09:00:00Z' },
  { id: 'mock-3', name: 'Jordan Lee', team: 'Under-14 A', status: 'VERIFIED', avatar: null, phone: '+91 99887 66554', date: '2024-02-01T14:00:00Z' },
  { id: 'mock-4', name: 'Casey Brown', team: 'Under-16 B', status: 'ACTIVE', avatar: null, phone: '+91 98765 11111', date: '2024-02-10T12:00:00Z' },
  { id: 'mock-5', name: 'Riley Davis', team: 'Under-14 A', status: 'INVITED', avatar: null, phone: '+91 91234 99999', date: '2024-02-18T16:00:00Z' },
  { id: 'mock-6', name: 'Morgan Taylor', team: 'Under-16 B', status: 'ACTIVE', avatar: null, phone: '+91 98700 12345', date: '2024-02-17T11:00:00Z' },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() ?? '?'
}

function statusDotClass(status: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'ACTIVE' || s === 'VERIFIED') return 'bg-green-500'
  if (s === 'INVITED') return 'bg-orange-500'
  return 'bg-gray-400'
}

function formatDate(value: string | undefined | null): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return value
  }
}

function statusLabel(status: string): string {
  const s = (status || '').toUpperCase()
  if (s === 'VERIFIED') return 'Active'
  if (!s) return '—'
  return s.charAt(0) + s.slice(1).toLowerCase()
}

type AdminPlayersPageProps = {
  players: PlayerListItem[]
  playersSearch: string
  onSearchChange: (value: string) => void
  onFilter: () => void
  onRefresh: () => void
  onViewPlayer: (id: string) => void
  isLoading?: boolean
  isLoadingProfile?: boolean
  /** When provided, show pagination (for API data) */
  playersPage?: number
  playersTotalPages?: number
  playersTotal?: number
  onPrevPage?: () => void
  onNextPage?: () => void
}

export function AdminPlayersPage({
  players,
  playersSearch,
  onSearchChange,
  onFilter,
  onRefresh,
  onViewPlayer,
  isLoading,
  isLoadingProfile,
  playersPage,
  playersTotalPages,
  playersTotal,
  onPrevPage,
  onNextPage,
}: AdminPlayersPageProps) {
  const displayPlayers = players.length > 0 ? players : MOCK_PLAYERS

  return (
    <div className="min-h-0 flex flex-col rounded-xl p-4 sm:p-6 bg-gray-50 overflow-auto" style={{ background: 'var(--color-bg-body)' }}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold m-0 text-gray-900 shrink-0" style={{ color: 'var(--color-text-main)' }}>
          Players
        </h1>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="relative flex-1 sm:flex-initial min-w-0 sm:min-w-[200px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
              style={{ color: 'var(--color-text-muted)' }}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search players…"
              value={playersSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#82C91E]/40"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-main)',
              }}
              aria-label="Search players"
            />
          </div>
          <button
            type="button"
            onClick={onFilter}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
            style={{
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-main)',
            }}
          >
            <SlidersHorizontal size={18} strokeWidth={2} aria-hidden />
            Filter
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            style={{
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-main)',
            }}
          >
            <RefreshCw size={18} strokeWidth={2} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      {/* Player list table */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm min-w-0"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr
                style={{
                  background: 'var(--color-surface-soft)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">
                  User
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Phone
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Date
                </th>
                <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Loading players…
                  </td>
                </tr>
              ) : displayPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No players found. Try adjusting search or filters.
                  </td>
                </tr>
              ) : (
                displayPlayers.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b transition-colors hover:bg-[var(--color-surface-soft)]"
                    style={{
                      borderBottomColor: 'var(--color-border-subtle)',
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden bg-gray-100 text-gray-600">
                          {p.avatar ? (
                            <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(p.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: 'var(--color-text-main)' }}>
                            {p.name}
                          </p>
                          <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {p.team}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-main)' }}>
                      {p.phone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(p.status)}`}
                          aria-hidden
                        />
                        <span className="text-sm" style={{ color: 'var(--color-text-main)' }}>
                          {statusLabel(p.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(p.date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewPlayer(p.id)}
                        disabled={isLoading || isLoadingProfile}
                        className="text-sm font-medium text-[#82C91E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#82C91E]/40 rounded disabled:opacity-50"
                      >
                        View profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {displayPlayers.length > 0 && playersPage != null && playersTotalPages != null && onPrevPage && onNextPage && (
        <div className="flex justify-between items-center gap-3 mt-6 flex-wrap">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={isLoading || playersPage <= 1}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-main)' }}
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-500" style={{ color: 'var(--color-text-muted)' }}>
            Page {playersPage} of {playersTotalPages}
            {playersTotal != null ? ` · Total ${playersTotal}` : ''}
          </span>
          <button
            type="button"
            onClick={onNextPage}
            disabled={isLoading || playersPage >= playersTotalPages}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-main)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
