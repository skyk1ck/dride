import React from 'react';
import { useThemeStore } from '../store/themeStore';
import { useUserStore } from '../store/userStore';

export const Footer = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const currentUser = useUserStore((state) => state.currentUser);

  return (
    <footer className={`${isDarkMode ? 'bg-black' : 'bg-white'} py-16 mt-auto border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
      <div className={`max-w-7xl mx-auto px-4 ${currentUser ? 'ml-20' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Dride</h3>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Invest in your future with our comprehensive online learning platform.
            </p>
          </div>
          
          <div>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Contact</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="mailto:llc.onyx.group@gmail.com" 
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  llc.onyx.group@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Social Media</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="https://t.me" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  Telegram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Legal</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} mt-12 pt-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p>© {new Date().getFullYear()} Dride. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};