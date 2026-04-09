// constants/theme.ts
// Global Design System Tokens — Multi-Theme Support

export const LIGHT_THEME = {
  primary: '#4A7C59',      // Forest Green
  primaryDark: '#3A6347',
  primaryLight: '#659D77',
  accent: '#8FC0A9',       // Sage
  action: '#E67E22',       // Soft Orange
  bg: '#F8F9FA',           // Off-White
  bgCard: '#FFFFFF',
  bgSurface: '#FFFFFF',
  textPrimary: '#2D3436',  // Dark Slate
  textSecondary: '#636E72',
  textMuted: '#B2BEC3',
  border: '#DFE6E9',
};

export const MIDNIGHT_FOREST_THEME = {
  primary: '#8FC0A9',      // Sage Green (Brand Consistency)
  primaryDark: '#79A38F',
  primaryLight: '#A4D0BD',
  accent: '#8FC0A9',
  action: '#F39C12',       // Warm Amber (User Requested)
  bg: '#121B14',           // Deepest Forest Green
  bgCard: '#1E2A22',        // Muted Sage Dark
  bgSurface: '#1E2A22',
  textPrimary: '#E8F0EA',  // Soft Mint White
  textSecondary: '#A0AFA3', // Dusty Moss
  textMuted: '#5D6B60',
  border: '#2C3A32',
};

// Legacy support for basic colors that don't change
export const COLORS = {
  primary: '#4A7C59',
  primaryDark: '#3A6347',
  primaryLight: '#659D77',
  accent: '#8FC0A9',
  red: '#E74C3C',
  success: '#4A7C59',
  warning: '#F39C12',
  info: '#3498DB',
  bg: '#F8F9FA',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#B2BEC3',
  blue: '#3498DB',
  purple: '#9B59B6',
};

export const FONTS = {
  header: 'PlusJakartaSans-Bold',
  body: 'SourceSansPro-Regular',
  regular: 'System', 
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 22, xxl: 32, full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 4,
  },
};
