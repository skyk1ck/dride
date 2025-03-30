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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // State to track the user_id (this will increment for each message)
  const [userIdCounter, setUserIdCounter] = useState(1); // Start from 1

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages when component mounts
  useEffect(() => {
    loadMessages(); // Load messages from storage

    // Establish socket connection
    socketRef.current = io('http://localhost:5000'); // Adjust URL if needed

    // Listen for incoming messages from the server
    socketRef.current.on('message', (message: any) => {
      addMessage(message); // Add the message to the store
    });

    // Request current messages from the server (optional)
    socketRef.current.emit('getMessages');

    return () => {
      socketRef.current.disconnect();
    };
  }, [loadMessages, addMessage]);

  // Scroll to the bottom whenever the messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the user is logged in and the message is not empty
    if (!newMessage.trim()) {
      console.error('Attempt to send an empty message'); // Log empty message attempts
      return; // Don't submit the message if it's empty
    }

    // Prepare the message object
    let message = {
      message: newMessage.trim(), // Message content
      username: currentUser?.username || 'Anonymous', // Use 'Anonymous' if no username
    };

    // If the user is logged in, include the user_id
    if (currentUser && currentUser.id) {
      message = {
        ...message,
        user_id: currentUser.id, // Add user_id if logged in
      };
    } else {
      // Use null if not logged in (user_id can be optional in backend if necessary)
      message = {
        ...message,
        user_id: null,
      };
    }

    try {
      // Send the message to the backend to be saved in the database
      const response = await axios.post('http://localhost:5000/api/chat_messages', message, {
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`, // Authorization for authenticated users
        },
      });

      // Emit the new message to the server via Socket.IO
      socketRef.current.emit('sendMessage', response.data.data);

      // Immediately update the UI and save the message in the store
      addMessage(response.data.data);

      // Clear the input field
      setNewMessage('');
    } catch (error) {
      // If the error is token-related (invalid token or expired), handle it
      if (error.response && error.response.status === 401) {
        console.error('Invalid or expired token, generating a new one...');
        
        // Generate a new token or handle re-authentication here
        // If the user is not logged in, you could prompt them to log in again
        const newToken = generateRandomToken(); // Replace with your token generation method
        
        // Store the new token in the user store
        useUserStore.setState({ currentUser: { ...currentUser, token: newToken } });

        // Retry sending the message with the new token
        try {
          const response = await axios.post('http://localhost:5000/api/chat_messages', message, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
            },
          });

          // Emit the new message to the server via Socket.IO
          socketRef.current.emit('sendMessage', response.data.data);

          // Immediately update the UI and save the message in the store
          addMessage(response.data.data);

          // Clear the input field
          setNewMessage('');
        } catch (retryError) {
          console.error('Error sending message after token refresh:', retryError);
        }
      } else {
        console.error('Error sending message to backend:', error);
      }
    }
  };

  // Generate a random token for the user if the token is invalid or expired
  const generateRandomToken = () => {
    const array = new Uint8Array(10); // 10 bytes = 20 hex characters
    window.crypto.getRandomValues(array); // Using Web Crypto API in the browser
    return Array.from(array).map(byte => byte.toString(16).padStart(2, '0')).join('');
  };

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
                messages.map((message) => (
                  <div
                    key={`${message.user_id}-${message.timestamp}`} // Use a combination of user_id and timestamp for unique keys
                    className={`mb-4 flex ${message.username === currentUser.username ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${message.username === currentUser.username ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[80%]`}>
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                        {message.avatar && <img src={message.avatar} alt={message.username} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1 ${message.username === currentUser.username ? 'text-right' : 'text-left'}`}>
                          {message.username}
                        </div>
                        <div className={`rounded-lg p-3 ${message.username === currentUser.username ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-500 text-white') : (isDarkMode ? 'bg-gray-800' : 'bg-gray-100')}`}>
                          {message.text}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1 ${message.username === currentUser.username ? 'text-right' : 'text-left'}`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t">
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};





















