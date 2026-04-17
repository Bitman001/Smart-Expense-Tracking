export const COLORS = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#FD79A8',
  accent: '#00B894',
  accentLight: '#55EFC4',
  danger: '#FF6B6B',
  warning: '#FDCB6E',
  info: '#74B9FF',

  background: '#F8F9FE',
  card: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',
  border: '#E8E8F0',

  expense: '#FF6B6B',
  income: '#00B894',

  gradientPurple: ['#6C5CE7', '#A29BFE'] as const,
  gradientPink: ['#FD79A8', '#FDCB6E'] as const,
  gradientGreen: ['#00B894', '#55EFC4'] as const,
  gradientBlue: ['#74B9FF', '#0984E3'] as const,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  semibold: { fontFamily: 'System', fontWeight: '600' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
};
