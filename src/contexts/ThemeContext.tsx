import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Clear all existing classes to prevent any unwanted content
    const classesToRemove = Array.from(root.classList).filter(cls => 
      cls !== 'light' && cls !== 'dark'
    );
    
    // Remove any unwanted classes
    classesToRemove.forEach(cls => root.classList.remove(cls));
    
    // Remove theme classes
    root.classList.remove('light', 'dark');
    
    // Add only the theme class
    root.classList.add(theme);
    
    // Ensure the class attribute only contains the theme
    root.className = theme;
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};