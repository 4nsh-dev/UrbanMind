import { createContext, useContext, useEffect, useState } from 'react';

// Design spacing helper: 8px spacing grid
export const spacing = {
  xxs: '4px',    // 4px
  xs: '8px',     // 8px
  sm: '12px',    // 12px
  md: '16px',    // 16px
  lg: '24px',    // 24px
  xl: '32px',    // 32px
  xxl: '48px',   // 48px
};

// Unified border radius
export const borderRadius = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',     // 24px (standard card, sheet, and major blocks)
  xxl: '28px',    // 28px (dialogs and large surface containers)
  full: '9999px', // Fully rounded buttons/chips/pills
};

// Unified elevation levels
export const elevation = {
  e0: 'shadow-none',
  e1: 'shadow-md-elevation-1',
  e2: 'shadow-md-elevation-2',
  e3: 'shadow-md-elevation-3',
  e4: 'shadow-md-elevation-4',
  e5: 'shadow-md-elevation-5',
};

// Unified theme context
export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
