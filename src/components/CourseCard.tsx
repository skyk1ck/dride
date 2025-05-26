// components/CourseCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { useThemeStore } from '../store/themeStore';
import { useUserStore } from '../store/userStore';

interface CourseCardProps {
  course?: Course; // Optional course prop
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const currentUser = useUserStore((state) => state.currentUser);
  const navigate = useNavigate();

  if (!course) {
    return (
      <div className="p-6 rounded-2xl border bg-gray-100 text-gray-600">
        Loading course...
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/user/login');
      return;
    }
    navigate(`/course/${course.id}`);
  };

  const categoryColors: Record<string, string> = {
    'IT & Software': 'bg-pink-100',
    'Business': 'bg-orange-100',
    'Design': 'bg-blue-100',
    'Marketing': 'bg-green-100',
  };

  const categoryColor = categoryColors[course.category] || 'bg-purple-100';
  const instructorsList = Array.isArray(course.instructors) ? course.instructors : [];

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <div
        className={`p-6 rounded-2xl border ${
          isDarkMode ? 'bg-black border-white text-white' : categoryColor
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">{course.category}</span>
          <div className="ml-auto flex items-center gap-1">
            <span>⭐</span>
            <span className="text-sm">{course.rating?.toFixed(1) ?? 'N/A'}</span>
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-4">{course.title}</h3>
        <div className="flex items-center justify-between">
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {(course.students ?? 0).toLocaleString()} students
          </span>
          <div className="flex -space-x-2">
            {instructorsList.map((_, idx) => (
              <div
                key={idx}
                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


