import React, { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../store/userStore';
import { useChatStore } from '../store/chatStore';
import { useThemeStore } from '../store/themeStore';
import io from 'socket.io-client';
import axios from 'axios';

export const ChatPage = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const { messages, addMessage, loadMessages } = useChatStore();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [newMessage, setNewMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      message: newMessage.trim(),
      username: currentUser?.username || 'Anonymous',
      user_id: currentUser?.id ?? null,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/chat_messages', message);
      socketRef.current.emit('sendMessage', response.data.data);
      setNewMessage('');
      setAuthError('');
    } catch (error: any) {
      console.error('Send message error:', error);
      setAuthError('Something went wrong. Please try again.');
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/chat_messages');
        
        if (res.data && Array.isArray(res.data.data)) {
          
          res.data.data.forEach((msg: any) => {
            addMessage(msg);
          });
        } else {
          console.error('Unexpected response structure:', res.data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    
    loadMessages();

    
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Connected to the socket');
    });

    socketRef.current.on('initialMessages', (messages: any[]) => {
      messages.forEach((msg: any) => {
        addMessage(msg);
      });
    });

    socketRef.current.on('message', (newMessage: any) => {
      addMessage(newMessage);
    });

    socketRef.current.emit('getMessages');

    fetchMessages();  

    return () => {
      socketRef.current.disconnect();
    };
  }, [addMessage, loadMessages]);

  if (!currentUser) return null;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50'}`}>
      <div className="ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Community Chat</h1>
          <div className={`h-[600px] ${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-md flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <p>No messages yet</p>
              ) : (
                messages.map((message) => {
                  const uniqueKey = `${message.id}-${message.timestamp}`;
                  const isCurrentUser = message.username === currentUser.username;

                  return (
                    <div
                      key={uniqueKey}
                      className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                          {message.avatar && (
                            <img src={message.avatar} alt={message.username} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            {message.username || 'Anonymous'}
                          </div>
                          <div
                            className={`rounded-lg p-3 ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'}`}
                          >
                            {message.message}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className={`flex-1 p-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
                  />
                  <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    Send
                  </button>
                </div>
                {authError && <div className="text-red-500 text-sm">{authError}</div>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
























































