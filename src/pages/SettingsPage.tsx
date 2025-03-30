import React from 'react';
import { useThemeStore } from '../store/themeStore';

export const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="ml-20 p-8">
        <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>Settings</h1>
        
        <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-black border border-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>Dark Mode</span>
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-full ${
                isDarkMode ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              {isDarkMode ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};