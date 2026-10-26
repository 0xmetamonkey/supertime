export const THEME_TOKENS = {
  light: {
    background: '#F8F8F6',
    foreground: '#111111',
    surface: '#FFFFFF',
    muted: '#6B7280',
    border: '#E5E7EB',
    cardBorderRadius: 12,
    buttonBorderRadius: 8,
  },
  dark: {
    background: '#111111',
    foreground: '#FFFFFF',
    surface: '#1A1A1A',
    muted: '#9CA3AF',
    border: '#333333',
    cardBorderRadius: 12,
    buttonBorderRadius: 8,
  },
  accent: {
    pink: '#E91E8C',
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
  },
} as const;

export const API_ENDPOINTS = {
  SIGNAL: '/api/call/signal',
  WALLET: '/api/wallet',
  UPLOAD: '/api/upload',
  USER_PUSH_TOKEN: '/api/user/push-token',
  EXPLORE: '/api/explore',
} as const;
