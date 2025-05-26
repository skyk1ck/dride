import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { UserLoginPage } from './pages/UserLoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminPage } from './pages/AdminPage';
import { CoursePage } from './pages/CoursePage';
import { ProfilePage } from './pages/ProfilePage';
import { SavedCoursesPage } from './pages/SavedCoursesPage';
import { NewsPage } from './pages/NewsPage';
import { ChatPage } from './pages/ChatPage';

import { useUserStore } from './store/userStore';
import { useThemeStore } from './store/themeStore';
import { useCourseStore } from './store/courseStore';
import { useNewsStore } from './store/newsStore';
import { useChatStore } from './store/chatStore';
import { useAuthStore } from './store/authStore';

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, currentUser } = useAuthStore();

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }

  return <>{children}</>;
};

const ProtectedUserRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  return currentUser ? <>{children}</> : <Navigate to="/user/login" />;
};

function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const loadUsers = useUserStore((state) => state.loadUsers);
  const loadCourses = useCourseStore((state) => state.loadCourses);
  const loadNews = useNewsStore((state) => state.loadNews);
  const loadMessages = useChatStore((state) => state.loadMessages);

  useEffect(() => {
    loadUsers();
    loadCourses();
    loadNews();
    loadMessages();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/user/login" element={<UserLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin protected route */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <Layout><AdminPage /></Layout>
            </ProtectedAdminRoute>
          }
        />

        {/* Protected user routes */}
        <Route
          path="/course/:id"
          element={
            <ProtectedUserRoute>
              <Layout><CoursePage /></Layout>
            </ProtectedUserRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedUserRoute>
              <Layout><ProfilePage /></Layout>
            </ProtectedUserRoute>
          }
        />
        <Route
          path="/saved-courses"
          element={
            <ProtectedUserRoute>
              <Layout><SavedCoursesPage /></Layout>
            </ProtectedUserRoute>
          }
        />

        <Route path="/news" element={<Layout><NewsPage /></Layout>} />
        <Route path="/chat" element={<Layout><ChatPage /></Layout>} />

        {/* Fallback 404 route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
