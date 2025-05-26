import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './authStore'; 

interface News {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface NewsStore {
  news: News[];
  addNews: (newNews: News) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  loadNews: () => Promise<void>;
  setNews: (news: News[]) => void;
  setError: (error: string | null) => void; 
  error: string | null;
}

export const useNewsStore = create<NewsStore>((set) => ({
  news: [],
  error: null,
  setError: (error: string | null) => set({ error }),

  setNews: (news: News[]) => set({ news }),

  addNews: async (newNews: News) => {
    const token = useAuthStore.getState().getAuthToken();
    console.log('Token:', token);  
  
    if (!token) {
      const errorMsg = 'No auth token available';
      set({ error: errorMsg });  
      console.error('[NewsStore] ' + errorMsg);
      throw new Error(errorMsg);
    }
  
    console.log('[NewsStore] Token found:', token);
  
    const isAdmin = useAuthStore.getState().verifyAdminRole();
    console.log('Is Admin:', isAdmin);  
  
    if (!isAdmin) {
      const errorMsg = 'You do not have permission to add news';
      set({ error: errorMsg });  
      console.error('[NewsStore] ' + errorMsg);
      throw new Error(errorMsg);
    }
  
    try {
      console.log('[NewsStore] Attempting to add news:', newNews);
  
      const response = await axios.post('http://localhost:5000/api/news', newNews, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      console.log('[NewsStore] News added successfully:', response.data);
  
      
      set((state) => ({ news: [...state.news, response.data] }));
      set({ error: null });  
    } catch (error: any) {
      
      console.error('[NewsStore] Error adding news:', error);
      
      const errorMessage = error.response
        ? `API Error: ${error.response.data?.error || error.message}`
        : `Network Error: ${error.message}`;
      
      console.error('[NewsStore] Error Message:', errorMessage);
  
      if (error.response) {
        console.error('[NewsStore] Response Error Details:', error.response.data);
        console.error('[NewsStore] Status:', error.response.status);
      }
  
      set({ error: errorMessage });  
    }
  },

  
  deleteNews: async (id: string) => {
    const token = useAuthStore.getState().getAuthToken();
    
    if (!token) {
      set({ error: 'No auth token available' });
      console.error('[NewsStore] No auth token available for delete operation');
      throw new Error('No auth token available');
    }

    
    const isAdmin = useAuthStore.getState().verifyAdminRole();
    
    if (!isAdmin) {
      set({ error: 'You do not have permission to delete news' });
      console.error('[NewsStore] User does not have admin permissions to delete news');
      throw new Error('User is not an admin');
    }

    try {
      
      set((state) => ({ news: state.news.filter((item) => item.id !== id) }));

      await axios.delete(`http://localhost:5000/api/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('[NewsStore] News deleted successfully');
      set({ error: null }); 
    } catch (error: any) {
      const errorMessage = error.response
        ? `API Error: ${error.response.data?.message || error.message}`
        : `Network Error: ${error.message}`;

      console.error('[NewsStore] Error deleting news:', errorMessage);
      set({ error: errorMessage }); 
    }
  },

  
  loadNews: async () => {
    const token = useAuthStore.getState().getAuthToken();
    
    if (!token) {
    }

    try {
      const response = await axios.get('http://localhost:5000/api/news', {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ news: response.data });
      set({ error: null }); 
    } catch (error: any) {
      const errorMessage = error.response
        ? `API Error: ${error.response.data?.message || error.message}`
        : `Network Error: ${error.message}`;

      console.error('[NewsStore] Error loading news:', errorMessage);
      set({ error: errorMessage }); 
    }
  },
}));





