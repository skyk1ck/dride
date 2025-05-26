import create from 'zustand';
import axios from 'axios';

// Interfaces for User and Course
interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
  token?: string;
  courses?: string[];
  savedCourses?: string[]; // Adding savedCourses if it's part of the User model
}

interface Course {
  id: string;
  title: string;
  category: string;
  students: number;
  rating: number;
}

interface UserStore {
  users: User[];
  courses: Course[];
  currentUser: User | null;
  error: string | null;

  loadUsers: () => Promise<void>;
  loadCourses: () => Promise<void>;
  fetchCurrentUser: (userId: number) => Promise<void>;
  addUser: (user: { username: string; email: string; password: string }) => Promise<void>;
  setUsers: (users: User[]) => void;
  setCourses: (courses: Course[]) => void;
  updateAvatar: (userId: number, avatar: string) => void;
  deleteCourse: (courseId: string) => void;
  setCurrentUser: (user: User | null) => void;
  isAdmin: () => boolean;
  deleteUserByAdmin: (userId: number) => void;

  enrollCourse: (courseId: string) => Promise<void>;
  rateCourse: (courseId: string, rating: number) => Promise<void>;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  getAuthToken: () => string | null;
  refreshTokenIfInvalid: () => Promise<void>;
}

const API_URL = 'http://localhost:5000/api';

const decodeToken = (token: string) => {
  try {
    console.debug('Received token:', token);

    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format, missing parts:', parts);
      return null;
    }

    const base64Url = parts[1]; 
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
};

export const useUserStore = create<UserStore>((set) => {
  const storedUser = localStorage.getItem('currentUser');
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  return {
    users: [],
    courses: [],
    currentUser: initialUser,
    error: null,

    getAuthToken: () => {
      return localStorage.getItem('token');
    },
    
    saveCourse: async (courseId: string) => {
      const token = useUserStore.getState().getAuthToken();
      const user = useUserStore.getState().currentUser;

      if (!user || !token) {
        set({ error: 'User not authenticated' });
        return;
      }

      try {
        // Check if the course is already saved
        if (!user.savedCourses?.includes(courseId)) {
          const updatedUser = {
            ...user,
            savedCourses: user.savedCourses ? [...user.savedCourses, courseId] : [courseId],
          };

          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          set({ currentUser: updatedUser, error: null });
        } else {
          set({ error: 'Course already saved' });
        }
      } catch (error) {
        console.error('Error saving course:', error);
        set({ error: 'Failed to save course' });
      }
    },
    fetchSavedCourses: async () => {
  const token = localStorage.getItem('token');
  if (!token) return [];

  try {
    const response = await axios.get('http://localhost:5000/api/users/saved-courses', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; 
  } catch (err) {
    console.error('Error fetching saved courses:', err);
    return [];
  }
},



    removeSavedCourse: async (courseId: string) => {
      const token = useUserStore.getState().getAuthToken();
      const user = useUserStore.getState().currentUser;

      if (!user || !token) {
        set({ error: 'User not authenticated' });
        return;
      }

      try {
        const updatedSavedCourses = user.savedCourses?.filter((id) => id !== courseId);

        const updatedUser = {
          ...user,
          savedCourses: updatedSavedCourses,
        };

        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        set({ currentUser: updatedUser, error: null });
      } catch (error) {
        console.error('Error removing saved course:', error);
        set({ error: 'Failed to remove saved course' });
      }
    },

    isAuthenticated: () => {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const decodedToken = decodeToken(token);
      if (!decodedToken) return false;

      const tokenExpiration = decodedToken.exp * 1000;
      if (Date.now() > tokenExpiration) {
        localStorage.removeItem('token');
        return false;
      }
      return true;
    },
    

    login: async (username: string, password: string) => {
      try {
        const response = await axios.post(`${API_URL}/login`, { username, password });

        if (response.data.token) {
          const decodedToken = decodeToken(response.data.token);

          const user = {
            ...response.data.user,
            username,
            token: response.data.token,
          };

          localStorage.setItem('token', response.data.token);
          localStorage.setItem('currentUser', JSON.stringify(user));
          set({ currentUser: user, error: null });

          const tokenExpiration = decodedToken.exp * 1000;
          if (Date.now() > tokenExpiration) {
            set({ error: 'Token expired. Please login again.' });
            logout();
          }
        }
      } catch (error) {
        console.error('Login error:', error);
        set({ error: 'Invalid username or password' });
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      set({ currentUser: null, error: null });
    },

    loadUsers: async () => {
      const token = useUserStore.getState().getAuthToken();
      try {
        const response = await axios.get(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        set({ users: response.data });
      } catch (error) {
        console.error('Error loading users:', error);
        set({ error: 'Failed to load users' });
      }
    },

    loadCourses: async () => {
      const token = useUserStore.getState().getAuthToken();
      try {
        const response = await axios.get(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        set({ courses: response.data });
      } catch (error) {
        console.error('Error loading courses:', error);
        set({ error: 'Failed to load courses' });
      }
    },

    fetchCurrentUser: async (userId: number) => {
      const token = useUserStore.getState().getAuthToken();
      if (!userId) {
        set({ error: 'User ID is required' });
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userWithToken = {
          ...response.data,
          token,
        };
        localStorage.setItem('currentUser', JSON.stringify(userWithToken));
        set({ currentUser: userWithToken });
      } catch (error) {
        console.error('Error fetching user:', error);
        set({ error: 'Failed to fetch user' });
      }
    },

    setUsers: (users) => set({ users }),
    setCourses: (courses) => set({ courses }),

    updateAvatar: (userId, avatar) => {
      set((state) => {
        if (!state.currentUser || state.currentUser.id !== userId) return state;
        const updatedUser = { ...state.currentUser, avatar };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return { currentUser: updatedUser };
      });
    },

    setCurrentUser: (user) => {
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        set({ currentUser: user });
      } else {
        localStorage.removeItem('currentUser');
        set({ currentUser: null, error: 'No user found' });
      }
    },

    isAdmin: () => {
      const currentUser = useUserStore.getState().currentUser;
      return currentUser?.role === 'admin';
    },

    deleteUserByAdmin: (userId) => {
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
      }));
    },

    enrollCourse: async (courseId) => {
      const token = useUserStore.getState().getAuthToken();
      try {
        const response = await axios.post(`${API_URL}/courses/${courseId}/enroll`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Enrolled in course successfully:', response.data);
        set((state) => {
          if (state.currentUser) {
            const updatedUser = { 
              ...state.currentUser, 
              courses: state.currentUser.courses 
                ? [...state.currentUser.courses, courseId] 
                : [courseId] 
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            return { currentUser: updatedUser };
          }
          return state;
        });
      } catch (error) {
        console.error('Error enrolling in course:', error);
        set({ error: 'Failed to enroll in course' });
      }
    },

    rateCourse: async (courseId, rating) => {
      const token = useUserStore.getState().getAuthToken();
      if (!token) {
        set({ error: 'No authentication token found' });
        return;
      }

      try {
        const response = await axios.post(
          `${API_URL}/courses/${courseId}/rate`,
          { rating },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Course rated successfully:', response.data);

        if (!response.data || !response.data.rating) {
          set({ error: 'Invalid response from server' });
          return;
        }

        set((state) => {
          if (!state.courses) return state;

          const updatedCourses = state.courses.map((course) => {
            if (course.id === courseId) {
              return { ...course, rating: response.data.rating };
            }
            return course;
          });

          return { courses: updatedCourses };
        });
      } catch (error) {
        console.error('Error rating course:', error);
        set({ error: 'Failed to rate course. Please try again.' });
      }
    },

    refreshTokenIfInvalid: async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const decodedToken = decodeToken(token);
      const tokenExpiration = decodedToken.exp * 1000;

      if (Date.now() > tokenExpiration) {
        try {
          const response = await axios.post(`${API_URL}/refresh-token`, { token });
          const newToken = response.data.token;
          localStorage.setItem('token', newToken);

          set((state) => {
            if (state.currentUser) {
              const updatedUser = { ...state.currentUser, token: newToken };
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
              return { currentUser: updatedUser, error: null };
            }
            return state;
          });
        } catch (error) {
          console.error('Error refreshing token:', error);
          set({ error: 'Failed to refresh token, please log in again' });
        }
      }
    },
  };
});










