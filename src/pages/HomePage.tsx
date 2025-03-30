import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { AuthenticatedHome } from './AuthenticatedHome';

export const HomePage = () => {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.currentUser);

  if (currentUser) {
    return <AuthenticatedHome />;
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-black">EduHub</h1>
          <div className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-black">Find tutors</a>
            <a href="#" className="text-gray-600 hover:text-black">Corporate training</a>
            <a href="#" className="text-gray-600 hover:text-black">Become a tutor</a>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select className="bg-white text-black border border-gray-200 rounded-lg px-3 py-1">
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
          <button
            onClick={() => navigate('/user/login')}
            className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800"
          >
            Log in
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl font-bold text-black mb-6">
              Learn faster<br />
              with your best<br />
              education platform.
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Join thousands of students worldwide and accelerate your learning journey with our expert-led courses.
            </p>
            <button
              onClick={() => navigate('/register')}
              className="bg-black text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-800 transition-colors"
            >
              Get started →
            </button>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80"
              alt="Students learning"
              className="rounded-2xl shadow-xl"
            />
          </div>
        </div>

        <div className="mt-32 grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-black">44,000+</div>
            <div className="text-gray-600">Experienced tutors</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-black">300,000+</div>
            <div className="text-gray-600">5-star tutor reviews</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-black">120+</div>
            <div className="text-gray-600">Subjects taught</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-black">180+</div>
            <div className="text-gray-600">Tutor nationalities</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-black">4.8 ★★★★★</div>
            <div className="text-gray-600">on the App Store</div>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-gray-50 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Learn at your own pace</h3>
            <p className="text-gray-600">Access course content anytime, anywhere, and learn at a speed that suits you.</p>
          </div>
          <div className="p-8 bg-gray-50 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Expert instructors</h3>
            <p className="text-gray-600">Learn from industry professionals with years of practical experience.</p>
          </div>
          <div className="p-8 bg-gray-50 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Interactive learning</h3>
            <p className="text-gray-600">Engage with course materials through quizzes, projects, and peer discussions.</p>
          </div>
        </div>
      </main>
    </div>
  );
};