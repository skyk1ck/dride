import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';

export const Logo = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  
  return (
    <Link to="/" className="block mb-8">
      <div className={`w-10 h-10 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
};