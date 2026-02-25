import { MapPin, CheckCircle } from 'lucide-react'

export type CoachTimelineItem = {
  id: string
  time: string
  title: string
  location?: string
}

type CoachTimelineProps = {
  items: CoachTimelineItem[]
  onCheckIn?: (item: CoachTimelineItem) => void
  emptyMessage?: string
}

export function CoachTimeline({
  items,
  onCheckIn,
  emptyMessage = 'No sessions today',
}: CoachTimelineProps) {
  if (items.length === 0) {
    return (
      <p
        className="muted"
        style={{
          fontSize: 'var(--text-sm)',
          margin: 0,
          padding: 'var(--space-4)',
        }}
      >
        {emptyMessage}
      </p>
    )
  }

  return (
    <ul className="coach-timeline" role="list">
      {items.map((item) => (
        <li key={item.id} className="coach-timeline__item">
          <div className="coach-timeline__dot" aria-hidden />
          <div className="coach-timeline__content">
            <span className="coach-timeline__time">{item.time}</span>
            <span className="coach-timeline__title">{item.title}</span>
            {item.location && (
              <span className="coach-timeline__location">
                <MapPin size={14} aria-hidden />
                {item.location}
              </span>
            )}
            {onCheckIn && (
              <button
                type="button"
                className="button button--primary coach-timeline__checkin"
                onClick={() => onCheckIn(item)}
                style={{ marginTop: 'var(--space-2)' }}
              >
                <CheckCircle size={16} aria-hidden />
                Check-in
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
