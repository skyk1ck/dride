import React from 'react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useUserStore } from '../store/userStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const currentUser = useUserStore((state) => state.currentUser);

  return (
    <div className="min-h-screen flex flex-col">
      {currentUser && <Sidebar />}
      <main className={currentUser ? "ml-20 flex-1" : "flex-1"}>
        {children}
      </main>
      <Footer />
    </div>
  );
};