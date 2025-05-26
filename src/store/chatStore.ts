import { create } from 'zustand';
import { ChatMessage } from '../types';
import axios from 'axios'; 

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  loadMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],

  
  loadMessages: async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat_messages'); 
      const messages = response.data?.data || []; 
      set({ messages });
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  },

  
  addMessage: (message) => {
    const { messages } = get();

    
    const isDuplicate = messages.some(
      (msg) =>
        msg.message === message.message &&
        msg.username === message.username &&
        msg.timestamp === message.timestamp
    );

    if (isDuplicate) {
      console.log('Duplicate message detected, not adding it to state');
      return; 
    }

    
    const newMessage = {
      ...message,
      id: Date.now().toString(), 
      timestamp: new Date().toISOString(), 
    };

    
    const updatedMessages = [...messages, newMessage];

    
    set({ messages: updatedMessages });
  },
}));








