import { create } from 'zustand';


const base64UrlDecode = (base64Url: string): string => {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }

  const decoded = atob(base64);  
  return decoded;
};

const decodeJWT = (token: string) => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const payload = parts[1];
  const decodedPayload = base64UrlDecode(payload);

  try {
    const parsedPayload = JSON.parse(decodedPayload);
    return parsedPayload; 
  } catch (e) {
    console.error('Error parsing JSON payload:', e);
    return null;
  }
};

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  token: string;
}

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  checkAuthToken: () => boolean;
  verifyAdminRole: () => boolean;
  initializeAuth: () => void;
  fetchUserRole: () => string | null;
  getAuthToken: () => string | null;  
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,

  login: async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Login failed:', errorText);
        return false;
      }

      const { token, user } = await response.json();
      const userWithToken: User = { ...user, token };

      
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userWithToken));
      localStorage.setItem('token', token);

      set({
        isAuthenticated: true,
        currentUser: userWithToken,
      });

      console.log('Login successful:', userWithToken);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  logout: () => {
    set({ isAuthenticated: false, currentUser: null });
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
  },

  setCurrentUser: (user) => {
    console.log('Setting currentUser:', user);  
    set({ currentUser: user });
    localStorage.setItem('currentUser', JSON.stringify(user));
  },

  checkAuthToken: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    try {
      const decoded = decodeJWT(token);
      if (!decoded.exp) {
        console.warn('Token has no expiry field');
        return false;
      }

      const isExpired = decoded.exp < Date.now() / 1000;
      return !isExpired;
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return false;
    }
  },

  verifyAdminRole: () => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      console.warn('No user found in state');
      return false;
    }
    return currentUser.role === 'admin';
  },

  fetchUserRole: () => {
    const currentUser = get().currentUser;
    if (!currentUser) {
      console.warn('No user found in state');
      return null;
    }
    console.log('Fetching role for user:', currentUser);  
    return currentUser.role;
  },

  initializeAuth: () => {
    const token = localStorage.getItem('token');
    let isAuthenticated = false;
    let currentUser = null;

    if (token) {
      try {
        const decoded = decodeJWT(token);
        const isExpired = decoded.exp < Date.now() / 1000;
        isAuthenticated = !isExpired;

        if (isAuthenticated) {
          currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
          console.log('Decoded token:', decoded);  
          console.log('Current User after decode:', currentUser);  
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        isAuthenticated = false;
      }
    }
    console.log(isAuthenticated);
    set({ isAuthenticated, currentUser });
  },

  
  getAuthToken: () => {
    const token = localStorage.getItem('token');
    return token;
  }
}));
















