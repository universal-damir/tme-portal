// Theme constants extracted from the original PDF generator
// Colors, fonts, spacing, and other design tokens

export const theme = {
  // Color palette
  colors: {
    primary: '#243F7B',        // Main brand color
    success: '#059669',        // Green theme color  
    info: '#2563eb',          // Blue theme color
    lightblue: '#0ea5e9',     // Light blue theme color (for family visas)
    warning: '#d97706',       // Orange theme color
    yellow: '#eab308',        // Yellow theme color (to match UI)
    purple: '#7c3aed',        // Purple theme color
    
    // Grays
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6', 
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Background colors
    background: {
      white: '#ffffff',
      light: '#fafbfc',
      lightGray: '#f8fafc',
      green: '#f0fdf4',
      blue: '#eff6ff',
      lightblue: '#f0f9ff',
      yellow: '#fffbeb',
    },
    
    // Border colors  
    border: {
      light: '#e5e7eb',
      gray: '#e2e8f0',
      green: '#bbf7d0',
      blue: '#bfdbfe',
      lightblue: '#7dd3fc',
      yellow: '#fed7aa',
    },
  },
  
  // Typography
  fonts: {
    primary: 'Helvetica',
  },
  
  fontSize: {
    xs: 10,
    sm: 11, 
    base: 12,
    lg: 14,
    xl: 22,
  },
  
  // Spacing
  spacing: {
    xs: 1,
    sm: 4,
    base: 8,
    md: 10,
    lg: 12,
    xl: 15,
    '2xl': 18,
    '3xl': 20,
  },
  
  // Border radius
  borderRadius: {
    base: 4,
    lg: 8,
    xl: 12,
  },
  
  // Line height
  lineHeight: {
    tight: 1.3,
    normal: 1.4,
  },
  
  // Letter spacing
  letterSpacing: {
    normal: 0,
    wide: 0.5,
  },
} as const; 