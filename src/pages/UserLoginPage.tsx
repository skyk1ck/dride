import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import axios from 'axios';

export const UserLoginPage = () => {
  const navigate = useNavigate();
  const login = useUserStore((state) => state.setCurrentUser); // Assuming this function is used to set the logged-in user
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Reset error message before attempting login
    
    try {
      // Make API call to backend to authenticate user
      const response = await axios.post('http://localhost:5000/api/login', {
        username: credentials.username,  // Sending username instead of email
        password: credentials.password,
      });

      // Check if the login was successful
      if (response.data.token) {
        // Store JWT token in localStorage
        localStorage.setItem('token', response.data.token);

        // Optionally, store user info (or just the token) in the store
        const user = { username: credentials.username, role: response.data.user.role };
        login(user);

        // Redirect to the home page or dashboard after successful login
        navigate('/');
      }
    } catch (error) {
      // Handle login failure
      setError('Invalid username or password');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">User Login</h1>
        
        {/* Display error message if login fails */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={credentials.username}
              onChange={(e) =>
                setCredentials({ ...credentials, username: e.target.value })
              }
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 mb-4"
          >
            Login
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-black hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};




