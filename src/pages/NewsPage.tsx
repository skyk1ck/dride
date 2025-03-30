import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Updated import for React Router v6
import { useAuthStore } from '../store/authStore'; // Assuming JWT token is stored here
import { useNewsStore } from '../store/newsStore'; // News store to manage news
import { useThemeStore } from '../store/themeStore'; // For dark mode

export const NewsPage = () => {
  const { news, setNews, error } = useNewsStore();  // Added error state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); // Check if the user is authenticated (boolean)
  const token = useAuthStore((state) => state.getAuthToken()); // Retrieve token from auth store
  const isAdmin = useAuthStore((state) => state.currentUser?.role === 'admin'); // Check if user is an admin
  const isDarkMode = useThemeStore((state) => state.isDarkMode); // Get dark mode state
  const [newNews, setNewNews] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true); // Loading state
  const navigate = useNavigate(); // Updated for navigation

  // Fetch news data when component mounts or when token changes
  useEffect(() => {
    if (!isAuthenticated) {  // Check if user is not authenticated
      navigate('/login'); // Redirect to login page if not authenticated
    }

    const fetchNews = async () => {
      try {
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await fetch('http://localhost:5000/api/news', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Attach token in the header
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Error fetching news');
        }

        const newsData = await response.json();
        setNews(newsData);
      } catch (error) {
        console.error('Failed to fetch news:', error);
        setNews([]);  // Reset news to empty on error
      } finally {
        setLoading(false); // Set loading to false when data is fetched
      }
    };

    fetchNews();
  }, [token, setNews, navigate, isAuthenticated]); // Depend on token and isAuthenticated

  // Handle adding new news
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newNews.title && newNews.content) {
      try {
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await axios.post('http://localhost:5000/api/news', newNews, {
          headers: {
            'Authorization': `Bearer ${token}`, // Add token in the Authorization header
          },
        });

        setNews((prevNews) => [
          ...prevNews,
          { ...newNews, id: response.data.id, created_at: new Date().toISOString() }, // Add response ID
        ]);
        setNewNews({ title: '', content: '' });
      } catch (error) {
        console.error('Error adding news:', error);
        // Optionally handle error with state, e.g., setError('Failed to add news')
      }
    }
  };

  // Handle deleting news
  const handleDelete = async (id) => {
    try {
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, // Send token in the Authorization header
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setNews((prevNews) => prevNews.filter((item) => item.id !== id));
      } else {
        console.error('Error deleting news:', data.error);
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Optionally add a loading spinner here
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

        {error && (
          <div className="mb-4 text-red-500">{error}</div> // Display error if there is one
        )}

        <div className="space-y-6">
          {news.map((item) => (
            <div
              key={item.id} // Use item.id directly for uniqueness
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
                {new Date(item.created_at).toLocaleDateString()}
              </p>
              <p className="mt-4">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};













