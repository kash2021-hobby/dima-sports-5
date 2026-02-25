import { useRef, useState, useEffect } from 'react'
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  MoreHorizontal,
  Eye,
  EyeOff,
  X,
} from 'lucide-react'

/** Display shape: API user plus optional name/avatar for table display */
export type UserManagementUser = {
  id: string
  phone: string
  email?: string | null
  role: string
  status: string
  createdAt: string
  lastLoginAt?: string | null
  application?: { status?: string | null; submittedAt?: string | null } | null
  player?: { playerId?: string | null } | null
  name?: string | null
  avatarUrl?: string | null
}

const TABS = ['All', 'Users', 'Players', 'Coaches', 'Admins'] as const

const DUMMY_USERS: UserManagementUser[] = [
  {
    id: 'd1',
    phone: '+91 98765 43210',
    email: 'sarah.chen@example.com',
    name: 'Sarah Chen',
    role: 'COACH',
    status: 'ACTIVE',
    createdAt: '2024-01-15T10:00:00Z',
    lastLoginAt: '2024-02-18T14:30:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: 'd2',
    phone: '+91 91234 56789',
    email: 'raj.verma@example.com',
    name: 'Raj Verma',
    role: 'PLAYER',
    status: 'ACTIVE',
    createdAt: '2024-01-24T09:00:00Z',
    lastLoginAt: '2024-02-19T08:00:00Z',
  },
  {
    id: 'd3',
    phone: '+91 99887 66554',
    email: 'admin@dhsa.org',
    name: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2023-12-01T00:00:00Z',
    lastLoginAt: '2024-02-20T09:15:00Z',
  },
  {
    id: 'd4',
    phone: '+91 98765 11111',
    email: 'invited.user@example.com',
    name: 'Invited User',
    role: 'USER',
    status: 'INVITED',
    createdAt: '2024-02-10T12:00:00Z',
  },
  {
    id: 'd5',
    phone: '+91 91234 99999',
    email: 'priya.k@example.com',
    name: 'Priya K.',
    role: 'PLAYER',
    status: 'INVITED',
    createdAt: '2024-02-18T16:00:00Z',
  },
  {
    id: 'd6',
    phone: '+91 98700 12345',
    email: 'marcus.j@example.com',
    name: 'Marcus Johnson',
    role: 'COACH',
    status: 'ACTIVE',
    createdAt: '2024-01-08T11:00:00Z',
    lastLoginAt: '2024-02-17T17:00:00Z',
  },
]

function getDisplayName(u: UserManagementUser): string {
  return u.name ?? u.email ?? u.phone ?? 'User'
}

function getInitials(u: UserManagementUser): string {
  const name = u.name ?? u.email ?? ''
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
    return parts[0][0]?.toUpperCase() ?? '?'
  }
  if (u.phone) return u.phone.slice(-2)
  return '?'
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

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'PLAYER':
      return 'bg-blue-100 text-blue-800'
    case 'COACH':
      return 'bg-purple-100 text-purple-800'
    case 'ADMIN':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function statusDotClass(status: string): string {
  if (status === 'ACTIVE' || status === 'VERIFIED') return 'bg-green-500'
  if (status === 'INVITED') return 'bg-orange-500'
  return 'bg-gray-400'
}

function resolveAvatarUrl(avatarUrl: string | null | undefined, apiBaseUrl?: string): string | null {
  if (!avatarUrl) return null
  if (avatarUrl.startsWith('http')) return avatarUrl
  const base = apiBaseUrl ?? ''
  return base + (avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`)
}

const STATUS_OPTIONS = ['ACTIVE', 'INVITED', 'BLOCKED', 'VERIFIED', 'SUSPENDED'] as const

type EditUserDrawerProps = {
  user: UserManagementUser
  apiBaseUrl?: string
  authToken?: string | null
  onClose: () => void
  onSaved: () => void
}

function EditUserDrawer({ user, apiBaseUrl, authToken, onClose, onSaved }: EditUserDrawerProps) {
  const [name, setName] = useState(getDisplayName(user))
  const [phone, setPhone] = useState(user.phone)
  const [email, setEmail] = useState(user.email ?? '')
  const [photo, setPhoto] = useState(user.avatarUrl ?? '')
  const [mpin, setMpin] = useState('')
  const [showMpin, setShowMpin] = useState(false)
  const [status, setStatus] = useState(user.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const photoDisplayUrl = resolveAvatarUrl(photo || user.avatarUrl, apiBaseUrl)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiBaseUrl || !authToken) {
      setError('Not authenticated')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const body: Record<string, string | null> = {
        phone: phone.trim(),
        email: email.trim() ? email.trim() : null,
        status,
      }
      if (name.trim()) body.name = name.trim()
      if (photo.trim()) body.photo = photo.trim()
      if (mpin.trim()) body.mpin = mpin.trim()
      const res = await fetch(`${apiBaseUrl}/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        onSaved()
      } else {
        setError(data?.message ?? 'Failed to update user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[var(--z-modal)]"
        style={{ zIndex: 50 }}
        aria-hidden="false"
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
          aria-label="Close"
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-full max-w-md overflow-y-auto shadow-xl"
          style={{
            background: 'var(--color-surface)',
            zIndex: 51,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-border-subtle)', background: 'var(--color-surface)' }}>
            <h2 className="text-lg font-bold m-0" style={{ color: 'var(--color-text-main)' }}>Edit user</h2>
            <button type="button" onClick={onClose} className="p-2 rounded-md hover:opacity-80" style={{ color: 'var(--color-text-muted)' }} aria-label="Close">
              <X size={20} strokeWidth={2} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <p className="text-sm py-2 px-3 rounded-lg bg-red-50 text-red-700" role="alert">{error}</p>
            )}

            {/* Profile picture */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>Profile picture</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'var(--color-surface-soft)' }}>
                  {photoDisplayUrl ? (
                    <img src={photoDisplayUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem' }}>{getInitials(user)}</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Image URL (e.g. /uploads/... or https://...)"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border text-sm"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-text-main)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-main)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>Phone number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-main)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-main)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>New password (MPIN, optional)</label>
              <div className="relative">
                <input
                  type={showMpin ? 'text' : 'password'}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value)}
                  placeholder="4-6 digits"
                  className="w-full px-3 py-2 pr-10 rounded-lg border text-sm"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border-subtle)',
                    color: 'var(--color-text-main)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowMpin((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={showMpin ? 'Hide password' : 'Show password'}
                >
                  {showMpin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-main)' }}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-main)',
                }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border text-sm font-medium"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border-subtle)',
                  color: 'var(--color-text-main)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

type UserManagementPageProps = {
  users: UserManagementUser[]
  isLoading: boolean
  usersSearch: string
  onSearchChange: (value: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
  onFilterClick: () => void
  onAddUser: () => void
  usersPage: number
  usersTotalPages: number
  usersTotal: number
  onPrevPage: () => void
  onNextPage: () => void
  apiBaseUrl?: string
  authToken?: string | null
  onUserUpdated?: () => void
}

export function UserManagementPage({
  users,
  isLoading,
  usersSearch,
  onSearchChange,
  activeTab,
  onTabChange,
  onFilterClick,
  onAddUser,
  usersPage,
  usersTotalPages,
  usersTotal,
  onPrevPage,
  onNextPage,
  apiBaseUrl,
  authToken,
  onUserUpdated,
}: UserManagementPageProps) {
  const displayUsers = users.length > 0 ? users : (isLoading ? [] : DUMMY_USERS)
  const showingDummy = !isLoading && users.length === 0 && DUMMY_USERS.length > 0

  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserManagementUser | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenForId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      className="rounded-xl p-4 sm:p-6 min-h-0"
      style={{ background: 'var(--color-bg-body)' }}
    >
      {/* Header row: title + toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 mb-6">
        <h1
          className="text-2xl font-bold m-0 shrink-0"
          style={{ color: 'var(--color-text-main)' }}
        >
          User Management
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial min-w-0 sm:min-w-[200px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Search phone or email"
              value={usersSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-offset-0"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border-subtle)',
                color: 'var(--color-text-main)',
              }}
              aria-label="Search users"
            />
          </div>
          <button
            type="button"
            onClick={onFilterClick}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium shadow-sm"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-main)',
            }}
          >
            <SlidersHorizontal size={18} strokeWidth={2} aria-hidden />
            Filter
          </button>
          <button
            type="button"
            onClick={onAddUser}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow"
            style={{
              background: 'var(--color-primary)',
            }}
          >
            <UserPlus size={18} strokeWidth={2} aria-hidden />
            Add User
          </button>
        </div>
      </div>

      {/* Pill tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'shadow-sm'
                : ''
            }`}
            style={
              activeTab === tab
                ? {
                    background: 'var(--color-surface)',
                    color: 'var(--color-primary-strong)',
                  }
                : {
                    background: 'transparent',
                    color: 'var(--color-text-muted)',
                  }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div
        className="rounded-xl border overflow-hidden shadow-sm"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        {showingDummy && (
          <p
            className="text-sm px-6 py-2 border-b"
            style={{
              background: 'var(--color-surface-soft)',
              borderColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-muted)',
            }}
          >
            Showing sample data. No users from server.
          </p>
        )}
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
                  Role
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium uppercase tracking-wider px-6 py-3">
                  Date
                </th>
                <th className="text-right text-xs font-medium uppercase tracking-wider px-6 py-3 w-12">
                  Actions
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
                    Loading users…
                  </td>
                </tr>
              ) : displayUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No users found. Try switching tabs or clearing search.
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b transition-colors hover:bg-[var(--color-surface-soft)]"
                    style={{
                      borderBottomColor: 'var(--color-border-subtle)',
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {resolveAvatarUrl(user.avatarUrl, apiBaseUrl) ? (
                          <img
                            src={resolveAvatarUrl(user.avatarUrl, apiBaseUrl)!}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                            style={{
                              background: 'var(--color-surface-soft)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {getInitials(user)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className="font-medium truncate"
                            style={{ color: 'var(--color-text-main)' }}
                          >
                            {getDisplayName(user)}
                          </p>
                          <p
                            className="text-sm truncate"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {user.email || user.phone || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(user.role)}`}
                      >
                        {user.role === 'USER' ? 'User' : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass(user.status)}`}
                          aria-hidden
                        />
                        <span
                          className="text-sm"
                          style={{ color: 'var(--color-text-main)' }}
                        >
                          {user.status === 'VERIFIED' ? 'Active' : user.status.charAt(0) + user.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block" ref={menuOpenForId === user.id ? menuRef : undefined}>
                        <button
                          type="button"
                          onClick={() => setMenuOpenForId(menuOpenForId === user.id ? null : user.id)}
                          className="p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 hover:opacity-80"
                          style={{ color: 'var(--color-text-muted)' }}
                          aria-label="Actions"
                          aria-expanded={menuOpenForId === user.id}
                        >
                          <MoreHorizontal size={20} strokeWidth={2} />
                        </button>
                        {menuOpenForId === user.id && (
                          <div
                            className="absolute right-0 top-full mt-1 py-1 rounded-lg border shadow-lg z-10 min-w-[160px]"
                            style={{
                              background: 'var(--color-surface)',
                              borderColor: 'var(--color-border-subtle)',
                            }}
                          >
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm hover:opacity-90"
                              style={{ color: 'var(--color-text-main)' }}
                              onClick={() => {
                                setEditingUser(user)
                                setMenuOpenForId(null)
                              }}
                            >
                              Edit user details
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 mt-4"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <p className="text-sm m-0">
          Showing page {usersPage} / {usersTotalPages} · Total {usersTotal}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={isLoading || usersPage <= 1}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-main)',
            }}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={isLoading || usersPage >= usersTotalPages}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-main)',
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit user drawer */}
      {editingUser && (
        <EditUserDrawer
          user={editingUser}
          apiBaseUrl={apiBaseUrl}
          authToken={authToken}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null)
            onUserUpdated?.()
          }}
        />
      )}
    </div>
  )
}
