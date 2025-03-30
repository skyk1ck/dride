import { create } from 'zustand';
import {decode} from 'jwt-decode'; // Use correct import

const secretKey = 'your_secret_key'; // Don't use this in the frontend. Backend uses this for signing.

interface AuthState {
  isAuthenticated: boolean;
  currentUser: { username: string; role: string; token: string } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setCurrentUser: (user: { username: string; role: string; token: string }) => void;
  getAuthToken: () => string | null;
  decodeToken: () => { username: string; role: string } | null; 
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
  currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),

  login: async (username, password) => {
    console.log('Attempting login...');
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const { token, user } = await response.json();
      // Set user data and JWT token to Zustand and localStorage
      set({ isAuthenticated: true, currentUser: { ...user, token } });
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify({ ...user, token }));
      return true;
    }

    console.log('Invalid credentials.');
    return false;
  },

  logout: () => {
    console.log('Logging out...');
    set({ isAuthenticated: false, currentUser: null });
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  getAuthToken: () => {
    return useAuthStore.getState().currentUser?.token || null;
  },

  decodeToken: () => {
    const token = useAuthStore.getState().getAuthToken();
    if (token) {
      try {
        const decodedToken = jwt_decode(token); // Decode JWT token
        return decodedToken as { username: string; role: string };
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  },
}));











