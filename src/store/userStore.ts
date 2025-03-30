import create from 'zustand';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
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
  addCourse: (course: Course) => void;

  // Auth specific methods
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
  getAuthToken: () => string | null;
}

const API_URL = 'http://localhost:5000/api';

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  courses: [],
  currentUser: null,
  error: null,

  // Helper function to get token from localStorage
  getAuthToken: () => {
    return localStorage.getItem('token'); // Adjust if you store token differently
  },

  // Auth: Check if the user is authenticated
  isAuthenticated: () => {
    return Boolean(localStorage.getItem('token')); // Check if token exists
  },

  // Login: Authenticate user and store token
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
      });

      // Check if login was successful and store token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token); // Store the token
        // Fetch user data after successful login
        const user = { username, role: response.data.user.role };
        set({ currentUser: user, error: null });
      }
    } catch (error) {
      console.error('Login error:', error);
      set({ error: 'Invalid username or password' });
    }
  },

  // Logout: Remove token from localStorage and reset user state
  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, error: null });
  },

  // Load all users
  loadUsers: async () => {
    const token = useUserStore.getState().getAuthToken(); // Get the token
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token in the request header
        },
      });
      set({ users: response.data });
    } catch (error) {
      console.error('Error loading users:', error);
      set({ error: 'Failed to load users' });
    }
  },

  // Load all courses
  loadCourses: async () => {
    const token = useUserStore.getState().getAuthToken();
    try {
      const response = await axios.get(`${API_URL}/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ courses: response.data });
    } catch (error) {
      console.error('Error loading courses:', error);
      set({ error: 'Failed to load courses' });
    }
  },

  // Fetch the current user based on userId
  fetchCurrentUser: async (userId) => {
    const token = useUserStore.getState().getAuthToken();
    if (!userId) {
      set({ error: 'User ID is required' });
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ currentUser: response.data });
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ error: 'Failed to fetch user' });
    }
  },

  setUsers: (users) => set({ users }),
  setCourses: (courses) => set({ courses }),

  // Update the avatar for a specific user
  updateAvatar: (userId, avatar) => {
    set((state) => {
      if (!state.currentUser || state.currentUser.id !== userId) return state;
      return { currentUser: { ...state.currentUser, avatar } };
    });
  },

  addUser: async (user) => {
    const token = useUserStore.getState().getAuthToken();
    try {
      await axios.post(`${API_URL}/users`, user, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await set((state) => state.loadUsers());
    } catch (error) {
      console.error('Error adding user:', error);
      set({ error: 'Failed to add user' });
    }
  },

  deleteCourse: (courseId) => {
    set((state) => ({
      courses: state.courses.filter((course) => course.id !== courseId),
    }));
  },

  setCurrentUser: (user) => {
    if (user) {
      set({ currentUser: user });
    } else {
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

  addCourse: (course) => {
    set((state) => ({
      courses: [...state.courses, course],
    }));
  },
}));


