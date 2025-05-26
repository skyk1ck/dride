import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { CourseCard } from '../components/CourseCard';
import { AuthButtons } from '../components/AuthButtons';
import { useCourseStore } from '../store/courseStore';
import { Category } from '../types';
import { useUserStore } from '../store/userStore';
import { useThemeStore } from '../store/themeStore';

export const AuthenticatedHome = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const { courses, fetchCourses } = useCourseStore();
  const currentUser = useUserStore((state) => state.currentUser);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      await fetchCourses();
      setLoading(false);
    };

    loadCourses();
  }, [fetchCourses]);

  
  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter((course) => course.category === selectedCategory);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <Sidebar />
      <div className="ml-20 p-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Invest in your education
          </h1>
          <div className="flex items-center gap-4">
            <AuthButtons />
            <button className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              <Bell className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-600'}`} />
            </button>
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-500" />
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-4 mb-8">
          {['All', 'IT & Software', 'Media', 'Business'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as Category | 'All')}
              className={`px-4 py-2 rounded-full ${selectedCategory === category
                ? 'bg-white text-black'
                : isDarkMode
                ? 'bg-gray-800 text-white border border-white'
                : 'bg-white text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Course Listing */}
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Most Popular
        </h2>

        {/* Loading State */}
        {loading ? (
          <div className="text-center text-white">Loading courses...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => {
              const key = course.id && course.name ? `${course.id}-${course.name}` : `${index}`;

              return <CourseCard key={key} course={course} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};


