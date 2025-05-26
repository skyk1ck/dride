import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNewsStore } from '../store/newsStore';
import { useThemeStore } from '../store/themeStore';
import { Trash2 } from 'lucide-react';
import axios from 'axios';

export const NewsPage = () => {
  const { news, setNews, error, setError, addNews, deleteNews } = useNewsStore();
  const { isAuthenticated, fetchUserRole, currentUser, checkAuthToken, initializeAuth } = useAuthStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const navigate = useNavigate();

  const [newNews, setNewNews] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchNews = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/news', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setNews(response.data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      setError('Failed to fetch news');
      setNews([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (newNews.title && newNews.content) {
      try {
        await addNews(newNews);
        setError(null);
        setNewNews({ title: '', content: '' });
        await fetchNews();
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        setError(`Error adding news: ${errorMessage}`);
        console.error('Error adding news:', errorMessage);
      }
    } else {
      setError('Please fill out both the title and content.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNews(id);
      await axios.delete(`http://localhost:5000/api/news/${id}`);
    } catch (error) {
      setError('Error deleting news');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      initializeAuth();
    }

    if (!checkAuthToken()) {
      navigate('/login');
      return;
    }

    if (currentUser) {
      const userRole = fetchUserRole();
      if (userRole === 'admin') {
        setIsAdmin(true);
      }
      fetchNews();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, checkAuthToken, navigate, initializeAuth, fetchUserRole]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <div className="ml-20 p-8">
        <h1 className="text-2xl font-bold mb-6">News</h1>

        {isAdmin && (
          <form onSubmit={handleSubmit} className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-black border border-gray-800' : 'bg-white'} shadow-md`}>
            <h2 className="text-xl font-semibold mb-4">Add News</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={newNews.title}
                onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                className={`w-full p-2 rounded border ${isDarkMode ? 'bg-black border-gray-800 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={newNews.content}
                onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                rows={4}
                className={`w-full p-2 rounded border ${isDarkMode ? 'bg-black border-gray-800 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <button
              type="submit"
              className={`${isDarkMode ? 'bg-white text-black' : 'bg-black text-white'} px-4 py-2 rounded hover:opacity-90`}
            >
              Add News
            </button>
          </form>
        )}

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="space-y-6">
          {news.length === 0 ? (
            <div className="text-center text-lg font-semibold text-gray-500">
              No News Available
            </div>
          ) : (
            news.map((item) => (
              <div
                key={item.id}
                className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-black border border-gray-800' : 'bg-white'}`}
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold">{item.title}</h2>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
                  {new Date(item.date).toLocaleDateString()}
                </p>
                <p className="mt-4">{item.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};





















































