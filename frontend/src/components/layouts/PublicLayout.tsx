import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Heart } from 'lucide-react'

import { FloatingThemeButton } from '@/components/ui/theme-switcher'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Events', href: '/events' },
  { name: 'Sermons', href: '/sermons' },
  { name: 'Prayer Wall', href: '/prayer-wall' },
  { name: 'Testimonies', href: '/testimonies' },
  { name: 'Give', href: '/give' },
  { name: 'Contact', href: '/contact' },
]

export function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { getTheme } = useThemeStore()
  const theme = getTheme()
  
  // Check if it's a dark theme
  const isDarkTheme = theme.id === 'midnight-gold' || theme.id === 'northern-lights'

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-sm border-b shadow-sm"
        style={{ 
          backgroundColor: isDarkTheme ? `${theme.colors.card}f0` : `${theme.colors.background}f0`,
          borderColor: theme.colors.border 
        }}
      >
        <nav className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div 
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md group-hover:shadow-lg transition-shadow"
                style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
              >
                T
              </div>
              <span 
                className="text-xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia})` }}
              >
                Thembani Church
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all'
                    )}
                    style={{
                      backgroundColor: isActive ? `${theme.colors.primary}15` : 'transparent',
                      color: isActive ? theme.colors.primary : theme.colors.mutedForeground,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`
                        e.currentTarget.style.color = theme.colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = theme.colors.mutedForeground
                      }
                    }}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link to="/admin">
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                    style={{ backgroundColor: theme.colors.primary }}
                  >
                    Dashboard
                  </button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ color: theme.colors.mutedForeground }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`
                        e.currentTarget.style.color = theme.colors.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = theme.colors.mutedForeground
                      }}
                    >
                      Login
                    </button>
                  </Link>
                  <Link to="/register">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      Join Us
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden h-10 w-10 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: theme.colors.mutedForeground }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`
                e.currentTarget.style.color = theme.colors.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = theme.colors.mutedForeground
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div 
              className="md:hidden py-4 border-t"
              style={{ borderColor: theme.colors.border }}
            >
              <div className="flex flex-col gap-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: isActive ? `${theme.colors.primary}15` : 'transparent',
                        color: isActive ? theme.colors.primary : theme.colors.mutedForeground,
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )
                })}
                <hr className="my-3" style={{ borderColor: theme.colors.border }} />
                {isAuthenticated ? (
                  <Link
                    to="/admin"
                    className="px-4 py-3 rounded-lg text-sm font-semibold text-white text-center transition-colors"
                    style={{ backgroundColor: theme.colors.primary }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                      style={{ color: theme.colors.mutedForeground }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-3 rounded-lg text-sm font-semibold text-white text-center transition-colors"
                      style={{ backgroundColor: theme.colors.primary }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Join Us
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Floating Theme Switcher */}
      <FloatingThemeButton />

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-black text-xl"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
                >
                  T
                </div>
                <span className="text-xl font-bold">Thembani Church</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                "Thembani" means "have faith" in isiZulu. We are a community united by faith, 
                committed to Ubuntu, and passionate about serving South Africa.
              </p>
              <div 
                className="flex items-center gap-1 text-sm"
                style={{ color: theme.colors.gradientFrom }}
              >
                <Heart className="h-4 w-4" />
                <span>I am because we are</span>
              </div>
            </div>

            {/* Service Times */}
            <div>
              <h4 
                className="font-bold text-lg mb-4"
                style={{ color: theme.colors.gradientFrom }}
              >
                Service Times
              </h4>
              <ul className="text-sm text-gray-400 space-y-3">
                <li className="flex justify-between">
                  <span>Sunday Service</span>
                  <span className="text-white">9:00 & 11:00 AM</span>
                </li>
                <li className="flex justify-between">
                  <span>Wednesday Bible Study</span>
                  <span className="text-white">7:00 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Friday Youth Night</span>
                  <span className="text-white">6:00 PM</span>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 
                className="font-bold text-lg mb-4"
                style={{ color: theme.colors.gradientFrom }}
              >
                Contact Us
              </h4>
              <ul className="text-sm text-gray-400 space-y-3">
                <li>123 Grace Street</li>
                <li>Sandton, Johannesburg</li>
                <li>Gauteng, South Africa</li>
                <li className="pt-2">
                  <a 
                    href="mailto:info@thembani.church" 
                    className="text-white transition-colors"
                    style={{ }}
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.gradientFrom}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                  >
                    info@thembani.church
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:+27112345678" 
                    className="text-white transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.gradientFrom}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                  >
                    +27 11 234 5678
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 
                className="font-bold text-lg mb-4"
                style={{ color: theme.colors.gradientFrom }}
              >
                Quick Links
              </h4>
              <ul className="text-sm space-y-3">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="text-gray-400 transition-colors"
                      onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.gradientFrom}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Thembani Church. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <a 
                  href="#" 
                  className="transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.gradientFrom}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  Privacy Policy
                </a>
                <a 
                  href="#" 
                  className="transition-colors"
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.gradientFrom}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
