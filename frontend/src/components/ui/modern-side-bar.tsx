import React, { useState, useEffect } from 'react'
import { Menu, X, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

export interface NavigationItem {
  id: string
  name: string
  icon: React.ReactNode
  badge?: string
}

export interface SidebarBranding {
  logo: React.ReactNode
  title: string
  subtitle?: string
}

export interface SidebarUser {
  displayName?: string
  role?: string
  status?: string
  avatarInitials?: string
}

export interface SidebarProps {
  className?: string
  navigationItems: NavigationItem[]
  activeItem: string
  onItemClick: (id: string) => void
  user?: SidebarUser
  onLogout: () => void
  branding: SidebarBranding
  children: React.ReactNode
}

export function Sidebar({
  className = '',
  navigationItems,
  activeItem,
  onItemClick,
  user,
  onLogout,
  branding,
  children,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<'Active' | 'Away'>(
    () => (user?.status === 'ACTIVE' ? 'Active' : 'Away')
  )

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setIsOpen(!isOpen)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  const handleItemClick = (itemId: string) => {
    if (itemId === 'logout') {
      onLogout()
      return
    }
    onItemClick(itemId)
    if (window.innerWidth < 768) {
      setIsOpen(false)
    }
  }

  const primaryBg = '#82C91E'
  const primaryStrong = '#82C91E'

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-slate-900 shadow-md border border-slate-700 md:hidden hover:bg-slate-800 transition-all duration-200 text-slate-200"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
          aria-hidden
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-700 z-40 transition-all duration-300 ease-in-out flex flex-col overflow-x-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-28' : 'w-64'}
          md:translate-x-0
          ${className}
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-800/60">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: primaryBg }}
              >
                <div className="text-white flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                  {branding.logo}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-100 text-base">{branding.title}</span>
                {branding.subtitle && (
                  <span className="text-xs text-slate-400">{branding.subtitle}</span>
                )}
              </div>
            </div>
          )}

          {isCollapsed && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto shadow-sm"
              style={{ background: primaryBg }}
            >
              <div className="text-white flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                {branding.logo}
              </div>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 rounded-md hover:bg-slate-700 transition-all duration-200 text-slate-400"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-0.5 min-w-0">
            {navigationItems.map((item) => {
              const isActive = activeItem === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`
                      w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative
                      ${isActive ? 'bg-[#82C91E]/20 text-[#82C91E]' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}
                      ${isCollapsed ? 'justify-center px-2' : ''}
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center justify-center min-w-[24px] [&>svg]:w-5 [&>svg]:h-5">
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center justify-between w-full min-w-0 overflow-hidden">
                        <span className={`text-sm truncate ${isActive ? 'font-medium' : 'font-normal'}`}>
                          {item.name}
                        </span>
                        {item.badge && (
                          <span
                            className={`
                              flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded-full
                              ${isActive ? 'opacity-90' : 'bg-slate-700 text-slate-400'}
                            `}
                            style={isActive ? { backgroundColor: 'rgba(130, 201, 30, 0.3)', color: primaryStrong } : undefined}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {isCollapsed && item.badge && (
                      <div
                        className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full border border-white text-[10px] font-medium"
                        style={{ backgroundColor: 'rgba(130, 201, 30, 0.3)', color: primaryStrong }}
                      >
                        {parseInt(item.badge) > 9 ? '9+' : item.badge}
                      </div>
                    )}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.name}
                        {item.badge && (
                          <span className="ml-1.5 px-1 py-0.5 bg-slate-700 rounded-full text-[10px]">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-auto border-t border-slate-700">
          <div className={`border-b border-slate-700 bg-slate-800/40 ${isCollapsed ? 'py-3 px-2' : 'p-3'}`}>
            {!isCollapsed ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center px-3 py-2 rounded-md bg-slate-800/60 hover:bg-slate-700/50 transition-colors duration-200">
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-slate-200 font-medium text-sm">
                      {user?.avatarInitials ?? 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 ml-2.5">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {user?.displayName ?? user?.role ?? 'User'}
                    </p>
                    {user?.role && (
                      <p className="text-xs text-slate-400 truncate">
                        {availabilityStatus}
                      </p>
                    )}
                  </div>
                  <div
                    className="w-2 h-2 rounded-full ml-2 flex-shrink-0"
                    style={{ backgroundColor: availabilityStatus === 'Active' ? '#82C91E' : '#94a3b8' }}
                    title={availabilityStatus}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAvailabilityStatus((s) => (s === 'Active' ? 'Away' : 'Active'))}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 hover:text-slate-100 transition-colors"
                  aria-label={`Status: ${availabilityStatus}. Click to toggle.`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: availabilityStatus === 'Active' ? '#82C91E' : '#94a3b8' }}
                  />
                  {availabilityStatus}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="text-slate-200 font-medium text-sm">
                      {user?.avatarInitials ?? 'U'}
                    </span>
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900"
                    style={{ backgroundColor: availabilityStatus === 'Active' ? '#82C91E' : '#94a3b8' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAvailabilityStatus((s) => (s === 'Active' ? 'Away' : 'Active'))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700/60 hover:bg-slate-600/60 text-slate-300"
                  title={`Toggle status (${availabilityStatus})`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: availabilityStatus === 'Active' ? '#82C91E' : '#94a3b8' }}
                  />
                </button>
              </div>
            )}
          </div>

          <div className="p-3">
            <button
              onClick={() => handleItemClick('logout')}
              className={`
                w-full flex items-center rounded-md text-left transition-all duration-200 group
                text-red-400 hover:bg-red-500/20 hover:text-red-300
                ${isCollapsed ? 'justify-center p-2.5' : 'space-x-2.5 px-3 py-2.5'}
              `}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
              </div>
              {!isCollapsed && <span className="text-sm">Logout</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 border border-slate-600">
                  Logout
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 border-l border-b border-slate-600 rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`
          flex-1 min-w-0 transition-all duration-300 ease-in-out w-full min-h-screen flex flex-col bg-slate-50 p-8
          ${isCollapsed ? 'md:ml-28' : 'md:ml-64'}
        `}
      >
        {children}
      </div>
    </>
  )
}
