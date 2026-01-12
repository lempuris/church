import { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Users2,
  Calendar,
  BookOpen,
  HandHeart,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react'

// Button import removed - using native elements
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Members', href: '/admin/members', icon: Users },
  { name: 'Cells', href: '/admin/cells', icon: Users2, placeholder: true },
  { name: 'Events', href: '/admin/events', icon: Calendar, placeholder: true },
  { name: 'Sermons', href: '/admin/sermons', icon: BookOpen, placeholder: true },
  { name: 'Prayer Requests', href: '/admin/prayer-requests', icon: HandHeart, placeholder: true },
  { name: 'Testimonies', href: '/admin/testimonies', icon: MessageSquare, placeholder: true },
  { name: 'Settings', href: '/admin/settings', icon: Settings, placeholder: true },
]

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link to="/admin" className="text-xl font-bold text-primary">
            Church CMS
          </Link>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.placeholder ? '#' : item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  item.placeholder && 'opacity-50 cursor-not-allowed'
                )}
                onClick={(e) => {
                  if (item.placeholder) {
                    e.preventDefault()
                  }
                  setSidebarOpen(false)
                }}
              >
                <item.icon size={20} />
                {item.name}
                {item.placeholder && (
                  <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Soon</span>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          {/* User menu */}
          <div className="relative">
            <button
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden sm:inline">{user?.email}</span>
              <ChevronDown size={16} />
            </button>
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-50">
                  <div className="p-2">
                    <p className="text-sm font-medium px-2 py-1">{user?.email}</p>
                    <p className="text-xs text-muted-foreground px-2 pb-2 capitalize">
                      {user?.role}
                    </p>
                    <hr className="my-1" />
                    <button
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-muted rounded"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
