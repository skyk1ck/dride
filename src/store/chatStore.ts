import { create } from 'zustand';
import { ChatMessage } from '../types';
import { SecureStorage } from '../lib/storage';

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  loadMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],

  // Load messages from SecureStorage and update the state
  loadMessages: async () => {
    try {
      // Check if the messages exist and are not null or undefined
      const messages = (await SecureStorage.getData('chat_messages')) || [];
      set({ messages });
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  },

  // Add message and update state immediately (optimistic UI update)
  addMessage: (message) => {
    const { messages } = get();

    // Create a new message with a unique id (using timestamp) and current timestamp
    const newMessage = {
      ...message,
      id: Date.now().toString(), // Unique ID based on the current timestamp
      timestamp: new Date().toISOString(), // Add timestamp
    };

    // Add new message to the existing list of messages
    const updatedMessages = [...messages, newMessage];

    // Update the state with the new message list
    set({ messages: updatedMessages });

    // Save the updated messages to SecureStorage asynchronously
    SecureStorage.setData('chat_messages', updatedMessages).catch((err) => {
      console.error('Failed to save messages:', err);
    });
  },
}));






