import { Trophy, LogOut } from 'lucide-react'

export interface MobileTopHeaderUser {
  displayName?: string
  role?: string
  avatarInitials?: string
}

function roleBadgeLabel(role?: string): string {
  if (!role) return ''
  if (role === 'USER') return 'User Access'
  return `${role.charAt(0) + role.slice(1).toLowerCase()} access`
}

export interface MobileTopHeaderProps {
  user?: MobileTopHeaderUser
  onLogout: () => void
  pageTitle?: string
}

export function MobileTopHeader({ user, onLogout, pageTitle }: MobileTopHeaderProps) {
  const title = pageTitle ?? 'DHSA Sports'
  const badgeText = roleBadgeLabel(user?.role)

  return (
    <header className="sticky top-0 left-0 right-0 z-[var(--z-elevated)] flex justify-between items-center w-full px-4 py-3 bg-white border-b border-[var(--color-border-subtle)]">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="mobile-top-header__logo-icon w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-white flex-shrink-0">
            <Trophy size={20} strokeWidth={1.5} />
          </div>
          <span className="text-base font-semibold text-[var(--color-text-main)] truncate">{title}</span>
        </div>
        {badgeText && (
          <span className="text-xs text-[var(--color-text-muted)] pl-11">{badgeText}</span>
        )}
      </div>
      <div className="flex items-center gap-2 min-h-[44px] flex-shrink-0">
        {user?.avatarInitials && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
            {user.avatarInitials}
          </div>
        )}
        <button
          type="button"
          className="mobile-top-header__logout min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-0 border-none bg-transparent text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  )
}
