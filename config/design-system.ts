/**
 * Design System Configuration
 * Centralized design tokens for Project Zeta
 */

export const colors = {
  // Dark Mode (Primary)
  background: {
    primary: '#0A0E1A',
    secondary: '#141825',
    tertiary: '#1E2332',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    tertiary: '#64748B',
  },
  accent: {
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
    orange: '#F97316',
  },
  // Chart colors
  chart: {
    revenue: '#3B82F6', // Blue
    rent: '#8B5CF6', // Purple
    ebitda: '#10B981', // Green
    cashflow: '#14B8A6', // Teal
    rentLoad: '#F97316', // Orange
  },
} as const;

export const typography = {
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

export const spacing = {
  base: 8, // 8px grid system
} as const;

export const borderRadius = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
} as const;

