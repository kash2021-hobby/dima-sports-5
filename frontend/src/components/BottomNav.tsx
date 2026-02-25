import React from 'react'
import { LayoutDashboard, ClipboardList, FileText, Bell } from 'lucide-react'

export interface BottomNavItem {
  id: string
  name: string
  icon: React.ReactNode
}

const DEFAULT_ITEMS: BottomNavItem[] = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={24} strokeWidth={1.5} /> },
  { id: 'application', name: 'My Application', icon: <ClipboardList size={24} strokeWidth={1.5} /> },
  { id: 'documents', name: 'Documents', icon: <FileText size={24} strokeWidth={1.5} /> },
  { id: 'notifications', name: 'Notifications', icon: <Bell size={24} strokeWidth={1.5} /> },
]

export interface BottomNavProps {
  activeItem: string
  onItemClick: (id: string) => void
  items?: BottomNavItem[]
}

export function BottomNav({ activeItem, onItemClick, items = DEFAULT_ITEMS }: BottomNavProps) {
  return (
    <nav
      className="bottom-nav w-full grid"
      role="navigation"
      aria-label="Main"
      style={{ gridTemplateColumns: `repeat(${items.length || 1}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const isActive = activeItem === item.id
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => onItemClick(item.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="bottom-nav__icon">{item.icon}</span>
            <span>{item.name}</span>
          </button>
        )
      })}
    </nav>
  )
}
