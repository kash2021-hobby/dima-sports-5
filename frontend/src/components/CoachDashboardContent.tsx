import {
  Users,
  ClipboardList,
  User,
  Target,
  UsersRound,
} from 'lucide-react'
import { StatusBadge, type StatusBadgeVariant } from './StatusBadge'
import {
  CoachTimeline,
  type CoachTimelineItem,
} from './CoachTimeline'

function resolvePhotoSrc(
  photoUrl: string,
  apiBaseUrl?: string
): string {
  if (!photoUrl) return ''
  if (photoUrl.startsWith('http')) return photoUrl
  if (!apiBaseUrl) return photoUrl
  return `${apiBaseUrl}${photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`}`
}

function getPhotoFromApplication(app: any, apiBaseUrl?: string): string {
  const docs = app?.documents
  if (!Array.isArray(docs)) return ''
  const photo = docs.find(
    (d: any) => d.documentType === 'PHOTO' && d.fileUrl
  )
  return photo ? resolvePhotoSrc(photo.fileUrl, apiBaseUrl) : ''
}

function trialToStatusVariant(trial: any): StatusBadgeVariant {
  if (trial.status === 'PENDING') return 'pending'
  if (trial.outcome === 'NEEDS_RETEST') return 'needs-retest'
  if (trial.outcome === 'RECOMMENDED') return 'approved'
  if (trial.outcome === 'NOT_RECOMMENDED') return 'completed'
  if (trial.status === 'COMPLETED') return 'completed'
  return 'pending'
}

export type CoachDashboardContentProps = {
  trials: any[]
  myPlayers: any[]
  myTeams?: any[]
  isLoading: boolean
  apiBaseUrl?: string
  onNavigate: (moduleId: string) => void
  onSelectTrial: (trial: any) => void
}

export function CoachDashboardContent({
  trials,
  myPlayers,
  myTeams = [],
  isLoading,
  apiBaseUrl,
  onNavigate,
  onSelectTrial,
}: CoachDashboardContentProps) {
  const assignedCount = Array.isArray(myPlayers) ? myPlayers.length : 0
  const pendingCount = trials.filter((t) => t.status === 'PENDING').length
  const teamsCount = Array.isArray(myTeams) ? myTeams.length : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayTrials = trials.filter((t) => {
    if (!t.scheduledDate) return false
    const d = new Date(t.scheduledDate)
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  })

  const timelineItems: CoachTimelineItem[] = todayTrials.map((t) => ({
    id: t.id,
    time: t.scheduledTime || '—',
    title: (t.application?.fullName as string) || 'Trial',
    location: t.venue,
  }))

  const activeTrials = trials.filter(
    (t) => t.status === 'PENDING' || t.status === 'COMPLETED'
  )

  return (
    <div className="dashboard-grid dashboard-grid--coach">
      <div className="dashboard-main">
        <div className="dashboard-stats">
          <button
            type="button"
            className="dashboard-stat-card dashboard-stat-card--green"
            onClick={() => onNavigate('my-players')}
            aria-label={`Players: ${assignedCount}`}
          >
            <div className="dashboard-stat__header">
              <span className="dashboard-stat__icon-wrap">
                <Users size={20} className="dashboard-stat__icon" aria-hidden />
              </span>
              <span className="dashboard-stat__label">Players</span>
            </div>
            <p className="dashboard-stat__count">
              {isLoading ? '…' : assignedCount}
            </p>
          </button>

          <button
            type="button"
            className="dashboard-stat-card dashboard-stat-card--orange"
            onClick={() => onNavigate('assigned-trials')}
            aria-label={`Pending Evaluations: ${pendingCount}`}
          >
            <div className="dashboard-stat__header">
              <span className="dashboard-stat__icon-wrap">
                <ClipboardList
                  size={20}
                  className="dashboard-stat__icon"
                  aria-hidden
                />
              </span>
              <span className="dashboard-stat__label">Pending Evaluations</span>
            </div>
            <p className="dashboard-stat__count">
              {isLoading ? '…' : pendingCount}
            </p>
          </button>

          <button
            type="button"
            className="dashboard-stat-card dashboard-stat-card--blue"
            onClick={() => onNavigate('my-teams')}
            aria-label={`My Teams: ${teamsCount}`}
          >
            <div className="dashboard-stat__header">
              <span className="dashboard-stat__icon-wrap">
                <UsersRound size={20} className="dashboard-stat__icon" aria-hidden />
              </span>
              <span className="dashboard-stat__label">My Teams</span>
            </div>
            <p className="dashboard-stat__count">
              {isLoading ? '…' : teamsCount}
            </p>
          </button>

          <div
            className="dashboard-stat-card dashboard-stat-card--purple"
            role="presentation"
          >
            <div className="dashboard-stat__header">
              <span className="dashboard-stat__icon-wrap">
                <Target size={20} className="dashboard-stat__icon" aria-hidden />
              </span>
              <span className="dashboard-stat__label">Attendance Avg</span>
            </div>
            <div
              className="coach-dashboard-attendance"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <div
                className="coach-dashboard-attendance__ring"
                role="progressbar"
                aria-valuenow={85}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className="coach-dashboard-attendance__value">85%</span>
              </div>
            </div>
          </div>
        </div>

        <section className="dashboard-section">
          <h3 className="dashboard-section__title">Active Trials</h3>
          <div className="dashboard-table-wrap">
            <table className="trials-table data-table">
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Position</th>
                  <th>Trial Status</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="muted"
                      style={{
                        textAlign: 'center',
                        padding: 'var(--space-6)',
                      }}
                    >
                      Loading…
                    </td>
                  </tr>
                ) : activeTrials.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="muted"
                      style={{
                        textAlign: 'center',
                        padding: 'var(--space-6)',
                      }}
                    >
                      No active trials
                    </td>
                  </tr>
                ) : (
                  activeTrials.map((trial) => {
                    const app = trial.application
                    const photoUrl = getPhotoFromApplication(app, apiBaseUrl)
                    const fullName = app?.fullName || 'N/A'
                    const position =
                      app?.primaryPosition || '—'
                    return (
                      <tr key={trial.id}>
                        <td>
                          <div className="dashboard-recent-app__name-cell">
                            <span className="dashboard-recent-app__avatar">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt=""
                                />
                              ) : (
                                <span className="dashboard-recent-app__avatar-initial">
                                  {fullName.trim()
                                    ? fullName
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()
                                    : <User size={18} aria-hidden />}
                                </span>
                              )}
                            </span>
                            <span>{fullName}</span>
                          </div>
                        </td>
                        <td>{position}</td>
                        <td>
                          <StatusBadge
                            variant={trialToStatusVariant(trial)}
                            label={
                              trial.status === 'COMPLETED' && trial.outcome
                                ? `${trial.status} · ${trial.outcome}`
                                : undefined
                            }
                          />
                        </td>
                        <td className="trials-table__action">
                          <button
                            type="button"
                            className="button button--primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.875rem',
                            }}
                            onClick={() => onSelectTrial(trial)}
                          >
                            Quick Action
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside className="dashboard-aside">
        <section className="dashboard-section">
          <h3 className="dashboard-section__title">Today's Schedule</h3>
          <CoachTimeline
            items={timelineItems}
            onCheckIn={(item) => {
              const trial = trials.find((t) => t.id === item.id)
              if (trial) onSelectTrial(trial)
            }}
            emptyMessage="No sessions scheduled for today"
          />
        </section>
      </aside>
    </div>
  )
}
