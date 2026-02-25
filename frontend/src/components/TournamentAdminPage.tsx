import { Trophy, RefreshCw, Plus } from 'lucide-react'

export type AdminTournament = {
  id: string
  tournamentId: string
  name: string
  sport: string
  level: string
  genderCategory?: string | null
  ageCategory?: string | null
  status: string
  startDate?: string | null
  endDate?: string | null
  registrationDeadline?: string | null
  minSquadSize?: number | null
  maxSquadSize?: number | null
}

type TournamentAdminPageProps = {
  tournaments: AdminTournament[]
  activeTab: string
  isLoading?: boolean
  error?: string | null
  onRefresh: () => void
  onCreateTournament: () => void
  onViewTournament: (tournamentId: string) => void
  onPublishTournament?: (tournamentId: string) => void
  onTabChange?: (tab: string) => void
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return Number.isNaN(d.getTime())
      ? value
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return value
  }
}

function statusLabel(status: string): string {
  if (!status) return '—'
  const s = status.toUpperCase()
  if (s === 'DRAFT') return 'Draft'
  if (s === 'PUBLISHED') return 'Published'
  if (s === 'ONGOING') return 'Ongoing'
  if (s === 'COMPLETED') return 'Completed'
  return status
}

export function TournamentAdminPage({
  tournaments,
  activeTab,
  isLoading,
  error,
  onRefresh,
  onCreateTournament,
  onViewTournament,
  onPublishTournament,
  onTabChange,
}: TournamentAdminPageProps) {
  const total = tournaments.length
  const drafts = tournaments.filter((t) => t.status === 'DRAFT').length
  const published = tournaments.filter((t) => t.status === 'PUBLISHED').length
  const completed = tournaments.filter((t) => t.status === 'COMPLETED').length

  let filtered = tournaments
  if (activeTab === 'Drafts') {
    filtered = tournaments.filter((t) => t.status === 'DRAFT')
  } else if (activeTab === 'Published') {
    filtered = tournaments.filter((t) => t.status === 'PUBLISHED')
  } else if (activeTab === 'Completed') {
    filtered = tournaments.filter((t) => t.status === 'COMPLETED')
  }

  const currentTab = activeTab || 'All'
  const filterTabs: Array<'All' | 'Drafts' | 'Published' | 'Completed'> = [
    'All',
    'Drafts',
    'Published',
    'Completed',
  ]

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col min-h-0">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Trophy size={20} strokeWidth={1.8} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tournaments</h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage users, players, teams, and applications
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={18} strokeWidth={2} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onCreateTournament}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={18} strokeWidth={2} />
            <span>+ Create Tournament</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-blue-900">Total</p>
          <p className="mt-2 text-2xl font-semibold text-blue-900">{total}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-900">Drafts</p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">{drafts}</p>
        </div>
        <div className="rounded-xl bg-green-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-green-900">Published</p>
          <p className="mt-2 text-2xl font-semibold text-green-900">{published}</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-purple-900">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-purple-900">{completed}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table section */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Table controls */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-4">
          {filterTabs.map((tab) => {
            const isActive = currentTab === tab
            return (
              <button
                key={tab}
                type="button"
                className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => onTabChange?.(tab)}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3 sm:px-6">
                  Tournament
                </th>
                <th scope="col" className="px-4 py-3 sm:px-6">
                  Category
                </th>
                <th scope="col" className="px-4 py-3 sm:px-6">
                  Window
                </th>
                <th scope="col" className="px-4 py-3 sm:px-6">
                  Registration
                </th>
                <th scope="col" className="px-4 py-3 sm:px-6">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right sm:px-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500 sm:px-6"
                  >
                    Loading tournaments…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500 sm:px-6"
                  >
                    No tournaments found for this view.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const statusUpper = t.status?.toUpperCase()
                  let statusClasses = 'bg-gray-100 text-gray-800'
                  if (statusUpper === 'PUBLISHED') {
                    statusClasses = 'bg-green-100 text-green-800'
                  } else if (statusUpper === 'COMPLETED') {
                    statusClasses = 'bg-purple-100 text-purple-800'
                  } else if (statusUpper === 'ONGOING') {
                    statusClasses = 'bg-blue-100 text-blue-800'
                  }

                  return (
                    <tr
                      key={t.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900">
                            {t.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {t.sport} • {t.level}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                        {t.genderCategory || 'Mixed'} • {t.ageCategory || 'All Ages'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                        {formatDate(t.startDate)} – {formatDate(t.endDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 sm:px-6">
                        {formatDate(t.registrationDeadline)}
                      </td>
                      <td className="px-4 py-4 text-sm sm:px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses}`}
                        >
                          {statusLabel(t.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            onClick={() => onViewTournament(t.tournamentId)}
                          >
                            View
                          </button>
                          {t.status === 'DRAFT' && onPublishTournament && (
                            <button
                              type="button"
                              className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-700"
                              onClick={() => onPublishTournament(t.tournamentId)}
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

