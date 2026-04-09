// hooks/useTheme.ts
// Dynamic Theme Hook for FitAI Hub

import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { LIGHT_THEME, MIDNIGHT_FOREST_THEME } from '../constants/theme';

export const useTheme = () => {
  const themePreference = useSelector((state: RootState) => state.user.profile?.themePreference || 'light');
  
  const isDark = themePreference === 'midnight';
  const colors = isDark ? MIDNIGHT_FOREST_THEME : LIGHT_THEME;
  
  return {
    colors,
    isDark,
    theme: themePreference,
  };
};
