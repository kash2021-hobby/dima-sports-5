
export type StatusBadgeVariant =
  | 'pending'
  | 'approved'
  | 'under-review'
  | 'completed'
  | 'needs-retest'

const VARIANT_LABELS: Record<StatusBadgeVariant, string> = {
  pending: 'Pending',
  approved: 'Approved',
  'under-review': 'Under Review',
  completed: 'Completed',
  'needs-retest': 'Needs Retest',
}

type StatusBadgeProps = {
  variant: StatusBadgeVariant
  label?: string
  className?: string
}

export function StatusBadge({
  variant,
  label,
  className = '',
}: StatusBadgeProps) {
  const mod = `coach-view-badge--${variant}`
  return (
    <span
      className={`coach-view-badge ${mod} ${className}`.trim()}
      role="status"
    >
      {label ?? VARIANT_LABELS[variant]}
    </span>
  )
}
