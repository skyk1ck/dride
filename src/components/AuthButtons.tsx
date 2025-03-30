import React from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';

export const AuthButtons = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const isAdmin = useAuthStore((state) => state.isAuthenticated);

  if (currentUser || isAdmin) return null;

  return (
    <div className="flex items-center gap-4">
      <Link
        to="/user/login"
        className="text-gray-700 hover:text-black"
      >
        Login
      </Link>
      <Link
        to="/register"
        className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800"
      >
        Register
      </Link>
    </div>
  );
};