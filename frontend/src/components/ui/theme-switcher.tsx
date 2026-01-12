import { useState } from 'react'
import { Palette, Check, ChevronDown } from 'lucide-react'
import { themes, useThemeStore } from '@/store/theme'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'grid' | 'compact'
  className?: string
}

export function ThemeSwitcher({ variant = 'dropdown', className }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { currentTheme, setTheme, getTheme } = useThemeStore()
  const activeTheme = getTheme()

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
          title="Change theme"
        >
          <div
            className="w-5 h-5 rounded-full shadow-inner"
            style={{
              background: `linear-gradient(135deg, ${activeTheme.colors.gradientFrom}, ${activeTheme.colors.gradientTo})`,
            }}
          />
          <Palette className="h-4 w-4 text-muted-foreground" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Choose Theme</p>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto">
                {themes.map((theme) => (
                  <ThemeOption
                    key={theme.id}
                    theme={theme}
                    isActive={currentTheme === theme.id}
                    onClick={() => {
                      setTheme(theme.id)
                      setIsOpen(false)
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={currentTheme === theme.id}
            onClick={() => setTheme(theme.id)}
          />
        ))}
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg shadow-md"
            style={{
              background: `linear-gradient(135deg, ${activeTheme.colors.gradientFrom}, ${activeTheme.colors.gradientVia}, ${activeTheme.colors.gradientTo})`,
            }}
          />
          <div className="text-left">
            <p className="font-semibold text-foreground">{activeTheme.emoji} {activeTheme.name}</p>
            <p className="text-xs text-muted-foreground">{activeTheme.description}</p>
          </div>
        </div>
        <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 max-h-96 overflow-y-auto">
              {themes.map((theme) => (
                <ThemeOption
                  key={theme.id}
                  theme={theme}
                  isActive={currentTheme === theme.id}
                  onClick={() => {
                    setTheme(theme.id)
                    setIsOpen(false)
                  }}
                  showDescription
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface ThemeOptionProps {
  theme: typeof themes[0]
  isActive: boolean
  onClick: () => void
  showDescription?: boolean
}

function ThemeOption({ theme, isActive, onClick, showDescription }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
        isActive
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-muted border border-transparent'
      )}
    >
      <div
        className="w-8 h-8 rounded-lg shadow-sm flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})`,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{theme.emoji}</span>
          <span className="font-medium text-sm text-foreground">{theme.name}</span>
        </div>
        {showDescription && (
          <p className="text-xs text-muted-foreground truncate">{theme.description}</p>
        )}
      </div>
      {isActive && (
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
      )}
    </button>
  )
}

interface ThemeCardProps {
  theme: typeof themes[0]
  isActive: boolean
  onClick: () => void
}

function ThemeCard({ theme, isActive, onClick }: ThemeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all text-left group overflow-hidden',
        isActive
          ? 'border-primary shadow-lg'
          : 'border-border hover:border-primary/50 hover:shadow-md'
      )}
    >
      {/* Gradient Preview */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia}, ${theme.colors.gradientTo})`,
        }}
      />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl shadow-md"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})`,
            }}
          />
          {isActive && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
        <p className="font-semibold text-foreground mb-1">
          {theme.emoji} {theme.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {theme.description}
        </p>
        
        {/* Color Preview */}
        <div className="flex gap-1 mt-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.gradientVia }}
          />
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: theme.colors.gradientTo }}
          />
          <div
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
          />
        </div>
      </div>
    </button>
  )
}

// Floating theme button for easy access
export function FloatingThemeButton() {
  const [isOpen, setIsOpen] = useState(false)
  const { currentTheme, setTheme, getTheme } = useThemeStore()
  const activeTheme = getTheme()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-16 right-0 w-72 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/50">
              <p className="font-bold text-foreground flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Choose Your Theme
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Personalize your experience
              </p>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              {themes.map((theme) => (
                <ThemeOption
                  key={theme.id}
                  theme={theme}
                  isActive={currentTheme === theme.id}
                  onClick={() => {
                    setTheme(theme.id)
                    setIsOpen(false)
                  }}
                  showDescription
                />
              ))}
            </div>
          </div>
        </>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${activeTheme.colors.gradientFrom}, ${activeTheme.colors.gradientTo})`,
        }}
        title="Change theme"
      >
        <Palette className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>
    </div>
  )
}
