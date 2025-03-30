import { create } from 'zustand';
import { News } from '../types';
import { SecureStorage } from '../lib/storage';
import { useAuthStore } from './authStore'; // Import the auth store to check user authentication

interface NewsState {
  news: News[];
  addNews: (news: Omit<News, 'id' | 'date'>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  loadNews: () => Promise<void>;
  setNews: (news: News[]) => void; // Added setNews method to directly update the state
  error: string | null;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  news: [],
  error: null,

  // Loads news from secure storage and updates the state
  loadNews: async () => {
    const token = useAuthStore.getState().getAuthToken(); // Check for authentication token
    if (!token) {
      set({ error: 'User is not authenticated' });
      return;
    }

    try {
      const news = await SecureStorage.getData('news') || [];
      set({ news });
    } catch (error) {
      set({ error: 'Failed to load news' });
    }
  },

  // Adds a new news item to the state and secure storage
  addNews: async (news) => {
    const token = useAuthStore.getState().getAuthToken();
    if (!token) {
      set({ error: 'User is not authenticated' });
      return;
    }

    try {
      const { news: currentNews } = get();
      const newNews = {
        ...news,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };

      const updatedNews = [...currentNews, newNews];
      await SecureStorage.setData('news', updatedNews);
      set({ news: updatedNews });
    } catch (error) {
      set({ error: 'Failed to add news' });
    }
  },

  // Deletes a news item from the state and secure storage
  deleteNews: async (id) => {
    const token = useAuthStore.getState().getAuthToken();
    if (!token) {
      set({ error: 'User is not authenticated' });
      return;
    }

    try {
      const { news } = get();
      const updatedNews = news.filter((item) => item.id !== id);
      await SecureStorage.setData('news', updatedNews);
      set({ news: updatedNews });
    } catch (error) {
      set({ error: 'Failed to delete news' });
    }
  },

  // Directly updates the news state
  setNews: (news) => {
    set({ news });
  },
}));
