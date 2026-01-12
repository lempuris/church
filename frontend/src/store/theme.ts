import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 
  | 'african-sunset'
  | 'ocean-breeze'
  | 'forest-canopy'
  | 'royal-purple'
  | 'midnight-gold'
  | 'coral-reef'
  | 'northern-lights'

export interface Theme {
  id: ThemeId
  name: string
  description: string
  emoji: string
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    muted: string
    mutedForeground: string
    background: string
    foreground: string
    card: string
    cardForeground: string
    border: string
    input: string
    ring: string
    gradientFrom: string
    gradientVia: string
    gradientTo: string
  }
}

export const themes: Theme[] = [
  {
    id: 'african-sunset',
    name: 'African Sunset',
    description: 'Warm amber and orange tones inspired by the South African savanna',
    emoji: '🌅',
    colors: {
      primary: '#d97706',
      primaryForeground: '#ffffff',
      secondary: '#fef3c7',
      secondaryForeground: '#92400e',
      accent: '#fef3c7',
      accentForeground: '#92400e',
      muted: '#f5f5f4',
      mutedForeground: '#78716c',
      background: '#ffffff',
      foreground: '#1c1917',
      card: '#ffffff',
      cardForeground: '#1c1917',
      border: '#e7e5e4',
      input: '#e7e5e4',
      ring: '#d97706',
      gradientFrom: '#d97706',
      gradientVia: '#ea580c',
      gradientTo: '#e11d48',
    },
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool blues and teals reminiscent of Cape Town\'s coastline',
    emoji: '🌊',
    colors: {
      primary: '#0891b2',
      primaryForeground: '#ffffff',
      secondary: '#cffafe',
      secondaryForeground: '#164e63',
      accent: '#cffafe',
      accentForeground: '#164e63',
      muted: '#f0f9ff',
      mutedForeground: '#64748b',
      background: '#ffffff',
      foreground: '#0c4a6e',
      card: '#ffffff',
      cardForeground: '#0c4a6e',
      border: '#e0f2fe',
      input: '#e0f2fe',
      ring: '#0891b2',
      gradientFrom: '#0891b2',
      gradientVia: '#0284c7',
      gradientTo: '#6366f1',
    },
  },
  {
    id: 'forest-canopy',
    name: 'Forest Canopy',
    description: 'Rich greens inspired by the lush Tsitsikamma forests',
    emoji: '🌿',
    colors: {
      primary: '#059669',
      primaryForeground: '#ffffff',
      secondary: '#d1fae5',
      secondaryForeground: '#065f46',
      accent: '#d1fae5',
      accentForeground: '#065f46',
      muted: '#f0fdf4',
      mutedForeground: '#6b7280',
      background: '#ffffff',
      foreground: '#14532d',
      card: '#ffffff',
      cardForeground: '#14532d',
      border: '#dcfce7',
      input: '#dcfce7',
      ring: '#059669',
      gradientFrom: '#059669',
      gradientVia: '#10b981',
      gradientTo: '#14b8a6',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Majestic purples fit for Zulu royalty',
    emoji: '👑',
    colors: {
      primary: '#7c3aed',
      primaryForeground: '#ffffff',
      secondary: '#ede9fe',
      secondaryForeground: '#5b21b6',
      accent: '#ede9fe',
      accentForeground: '#5b21b6',
      muted: '#f5f3ff',
      mutedForeground: '#6b7280',
      background: '#ffffff',
      foreground: '#2e1065',
      card: '#ffffff',
      cardForeground: '#2e1065',
      border: '#e9d5ff',
      input: '#e9d5ff',
      ring: '#7c3aed',
      gradientFrom: '#7c3aed',
      gradientVia: '#a855f7',
      gradientTo: '#ec4899',
    },
  },
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    description: 'Elegant dark theme with golden accents',
    emoji: '✨',
    colors: {
      primary: '#eab308',
      primaryForeground: '#1c1917',
      secondary: '#292524',
      secondaryForeground: '#fef3c7',
      accent: '#292524',
      accentForeground: '#fef3c7',
      muted: '#292524',
      mutedForeground: '#a8a29e',
      background: '#1c1917',
      foreground: '#fafaf9',
      card: '#292524',
      cardForeground: '#fafaf9',
      border: '#44403c',
      input: '#44403c',
      ring: '#eab308',
      gradientFrom: '#eab308',
      gradientVia: '#f59e0b',
      gradientTo: '#f97316',
    },
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    description: 'Vibrant pinks and corals like the warm Indian Ocean',
    emoji: '🐚',
    colors: {
      primary: '#ec4899',
      primaryForeground: '#ffffff',
      secondary: '#fce7f3',
      secondaryForeground: '#9d174d',
      accent: '#fce7f3',
      accentForeground: '#9d174d',
      muted: '#fdf2f8',
      mutedForeground: '#6b7280',
      background: '#ffffff',
      foreground: '#831843',
      card: '#ffffff',
      cardForeground: '#831843',
      border: '#fbcfe8',
      input: '#fbcfe8',
      ring: '#ec4899',
      gradientFrom: '#ec4899',
      gradientVia: '#f43f5e',
      gradientTo: '#f97316',
    },
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    description: 'Mystical aurora colors - rare but magical',
    emoji: '🌌',
    colors: {
      primary: '#06b6d4',
      primaryForeground: '#ffffff',
      secondary: '#1e293b',
      secondaryForeground: '#67e8f9',
      accent: '#1e293b',
      accentForeground: '#67e8f9',
      muted: '#1e293b',
      mutedForeground: '#94a3b8',
      background: '#0f172a',
      foreground: '#f1f5f9',
      card: '#1e293b',
      cardForeground: '#f1f5f9',
      border: '#334155',
      input: '#334155',
      ring: '#06b6d4',
      gradientFrom: '#06b6d4',
      gradientVia: '#8b5cf6',
      gradientTo: '#ec4899',
    },
  },
]

interface ThemeState {
  currentTheme: ThemeId
  setTheme: (themeId: ThemeId) => void
  getTheme: () => Theme
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'african-sunset',
      setTheme: (themeId: ThemeId) => {
        set({ currentTheme: themeId })
        applyTheme(themeId)
      },
      getTheme: () => {
        const { currentTheme } = get()
        return themes.find(t => t.id === currentTheme) || themes[0]
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.currentTheme)
        }
      },
    }
  )
)

export function applyTheme(themeId: ThemeId) {
  const theme = themes.find(t => t.id === themeId) || themes[0]
  const root = document.documentElement
  
  root.style.setProperty('--color-primary', theme.colors.primary)
  root.style.setProperty('--color-primary-foreground', theme.colors.primaryForeground)
  root.style.setProperty('--color-secondary', theme.colors.secondary)
  root.style.setProperty('--color-secondary-foreground', theme.colors.secondaryForeground)
  root.style.setProperty('--color-accent', theme.colors.accent)
  root.style.setProperty('--color-accent-foreground', theme.colors.accentForeground)
  root.style.setProperty('--color-muted', theme.colors.muted)
  root.style.setProperty('--color-muted-foreground', theme.colors.mutedForeground)
  root.style.setProperty('--color-background', theme.colors.background)
  root.style.setProperty('--color-foreground', theme.colors.foreground)
  root.style.setProperty('--color-card', theme.colors.card)
  root.style.setProperty('--color-card-foreground', theme.colors.cardForeground)
  root.style.setProperty('--color-border', theme.colors.border)
  root.style.setProperty('--color-input', theme.colors.input)
  root.style.setProperty('--color-ring', theme.colors.ring)
  root.style.setProperty('--gradient-from', theme.colors.gradientFrom)
  root.style.setProperty('--gradient-via', theme.colors.gradientVia)
  root.style.setProperty('--gradient-to', theme.colors.gradientTo)
  
  // Set body background for dark themes
  document.body.style.backgroundColor = theme.colors.background
  document.body.style.color = theme.colors.foreground
}

// Initialize theme on app load
export function initializeTheme() {
  const stored = localStorage.getItem('theme-storage')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.currentTheme) {
        applyTheme(state.currentTheme)
      }
    } catch {
      applyTheme('african-sunset')
    }
  } else {
    applyTheme('african-sunset')
  }
}
