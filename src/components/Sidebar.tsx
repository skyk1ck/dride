import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, LogOut, Newspaper, BookmarkIcon, User, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';
import { Logo } from './Logo';

export const Sidebar = () => {
  const { isAuthenticated: isAdmin, logout: adminLogout } = useAuthStore();
  const { currentUser, logout: userLogout } = useUserStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const location = useLocation();

  const handleLogout = () => {
    if (isAdmin) adminLogout();
    if (currentUser) userLogout();
  };

  return (
    <div className={`h-screen w-20 fixed left-0 top-0 flex flex-col items-center py-8 ${
      isDarkMode ? 'bg-gray-900' : 'bg-[#FAF9F8]'
    } border-r border-gray-200`}>
      <Logo />
      
      <nav className="flex-1 flex flex-col gap-4">
        <Link to="/" className="w-10 h-10 flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            location.pathname === '/' ? 'bg-black text-white' : isDarkMode ? 'text-white' : 'text-gray-700'
          }`}>
            <Home className="w-5 h-5" />
          </div>
        </Link>

        <Link to="/news" className="w-10 h-10 flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            location.pathname === '/news' ? 'bg-black text-white' : isDarkMode ? 'text-white' : 'text-gray-700'
          }`}>
            <Newspaper className="w-5 h-5" />
          </div>
        </Link>

        <Link to="/chat" className="w-10 h-10 flex items-center justify-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            location.pathname === '/chat' ? 'bg-black text-white' : isDarkMode ? 'text-white' : 'text-gray-700'
          }`}>
            <MessageCircle className="w-5 h-5" />
          </div>
        </Link>

        {currentUser && (
          <>
            <Link to="/saved-courses" className="w-10 h-10 flex items-center justify-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                location.pathname === '/saved-courses' ? 'bg-black text-white' : isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                <BookmarkIcon className="w-5 h-5" />
              </div>
            </Link>

            <Link to="/profile" className="w-10 h-10 flex items-center justify-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                location.pathname === '/profile' ? 'bg-black text-white' : isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                <User className="w-5 h-5" />
              </div>
            </Link>
          </>
        )}
      </nav>

      {(isAdmin || currentUser) && (
        <button 
          onClick={handleLogout}
          className={`w-10 h-10 rounded-full flex items-center justify-center mt-auto ${
            isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};