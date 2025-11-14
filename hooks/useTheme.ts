import { useState, useEffect, useCallback } from 'react';
import { Theme } from '../types';

export function useTheme() {
  // Initialize state from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as Theme | null) || 'system';
  });

  const applyTheme = useCallback((themeToApply: Theme) => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');

    let effectiveTheme = themeToApply;
    if (themeToApply === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      effectiveTheme = systemTheme;
    }
    
    root.classList.add(effectiveTheme);
  }, []);

  // Effect to apply theme when component mounts or theme state changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Effect to listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  return { theme, setTheme };
}
