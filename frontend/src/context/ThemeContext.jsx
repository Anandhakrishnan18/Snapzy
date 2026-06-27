import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('snapzy-theme') || 'dark';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('snapzy-theme', theme);
    // Apply data-theme to the document element
    if (theme === 'enterprise') {
      document.documentElement.setAttribute('data-theme', 'enterprise');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const toggleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
