import {
  Users,
  User,
  ClipboardList,
  GraduationCap,
  Plus,
} from 'lucide-react'

type StatCardTheme = 'blue' | 'orange' | 'green' | 'purple'

const STAT_CARDS: Array<{ label: string; moduleId: 'players' | 'applications' | 'coach-management'; icon: typeof Users; theme: StatCardTheme }> = [
  { label: 'Total Players', moduleId: 'players', icon: Users, theme: 'blue' },
  { label: 'Applications', moduleId: 'applications', icon: ClipboardList, theme: 'orange' },
  { label: 'Coaches', moduleId: 'coach-management', icon: GraduationCap, theme: 'purple' },
]

const UPCOMING_EVENTS = [
  { date: 'Date - Dec 25', title: 'Event Title' },
  { date: 'Date - Dec 26', title: 'Event Trial Event' },
  { date: 'Date - Dec 27', title: 'Succeeded Group Event' },
]

export type DashboardStats = {
  totalPlayers: number
  pendingApplications: number
  coachesCount: number
}

export type RecentApplication = {
  id: string
  fullName: string
  preferredTeamNames?: string[]
  status: string
  submittedAt?: string | null
  createdAt: string
  photoUrl?: string | null
}

function resolvePhotoSrc(photoUrl: string, apiBaseUrl?: string): string {
  if (!photoUrl) return ''
  if (photoUrl.startsWith('http')) return photoUrl
  if (!apiBaseUrl) return photoUrl
  return `${apiBaseUrl}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`
}

type DashboardContentProps = {
  apiBaseUrl?: string
  stats?: DashboardStats
  recentApplications?: RecentApplication[]
  isLoading?: boolean
  error?: string | null
  onNavigate?: (moduleId: string) => void
  onCreateCoach?: () => void
  onActiveTeams?: () => void
}

const STAT_KEYS: (keyof DashboardStats)[] = ['totalPlayers', 'pendingApplications', 'coachesCount']

function formatDate(value: string | undefined | null): string {
  if (!value) return '—'
  try {
    const d = new Date(value)
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return value
  }
}

export function DashboardContent({
  apiBaseUrl,
  stats,
  recentApplications = [],
  isLoading,
  error,
  onNavigate,
  onCreateCoach,
  onActiveTeams,
}: DashboardContentProps) {
  if (error) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">Dashboard</p>
        <p className="muted">{error}</p>
      </div>
    )
  }

  return (
    <div className="dashboard-grid">
      <div className="dashboard-main">
        <div className="dashboard-stats">
          {STAT_CARDS.map(({ label, moduleId, icon: Icon, theme }, i) => {
            const count = stats ? stats[STAT_KEYS[i]] : 0
            const content = (
              <>
                <div className="dashboard-stat__header">
                  <span className="dashboard-stat__icon-wrap">
                    <Icon size={20} className="dashboard-stat__icon" aria-hidden />
                  </span>
                  <span className="dashboard-stat__label">{label}</span>
                </div>
                <p className="dashboard-stat__count">{isLoading ? '…' : count}</p>
              </>
            )
            const cardClass = `dashboard-stat-card dashboard-stat-card--${theme}`
            if (onNavigate) {
              return (
                <button
                  key={label}
                  type="button"
                  className={cardClass}
                  onClick={() => onNavigate(moduleId)}
                  aria-label={`${label}: ${count}`}
                >
                  {content}
                </button>
              )
            }
            return (
              <div key={label} className={cardClass}>
                {content}
              </div>
            )
          })}
        </div>

        <section className="dashboard-section">
          <h3 className="dashboard-section__title">Quick Actions</h3>
          <div className="dashboard-actions">
            <button
              type="button"
              className="button dashboard-action-btn"
              onClick={onCreateCoach}
            >
              <Plus size={18} aria-hidden />
              Create Coach
            </button>
            <button
              type="button"
              className="button dashboard-action-btn"
              onClick={onActiveTeams}
            >
              <Plus size={18} aria-hidden />
              Active Teams
            </button>
          </div>
        </section>

        <section className="dashboard-section">
          <h3 className="dashboard-section__title">Recent Applications</h3>
          <div className="dashboard-table-wrap">
            <table className="trials-table data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Team name</th>
                  <th>Application</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      Loading…
                    </td>
                  </tr>
                ) : recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                      No applications
                    </td>
                  </tr>
                ) : (
                  recentApplications.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="dashboard-recent-app__name-cell">
                          <span className="dashboard-recent-app__avatar">
                            {row.photoUrl ? (
                              <img src={resolvePhotoSrc(row.photoUrl, apiBaseUrl)} alt="" />
                            ) : (
                              <span className="dashboard-recent-app__avatar-initial">
                                {row.fullName?.trim() ? row.fullName.trim().charAt(0).toUpperCase() : <User size={18} aria-hidden />}
                              </span>
                            )}
                          </span>
                          <span>{row.fullName}</span>
                        </div>
                      </td>
                      <td>{row.preferredTeamNames?.length ? row.preferredTeamNames.join(', ') : '—'}</td>
                      <td>{row.status}</td>
                      <td>{formatDate(row.submittedAt ?? row.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="dashboard-aside">
        <section className="dashboard-section">
          <h3 className="dashboard-section__title">Upcoming Events</h3>
          <ul className="dashboard-events" role="list">
            {UPCOMING_EVENTS.map((event, i) => (
              <li key={i} className="dashboard-event-card">
                <span className="dashboard-event__date">{event.date}</span>
                <span className="dashboard-event__title">{event.title}</span>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
