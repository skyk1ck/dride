import React from 'react';
import { CourseCard } from '../components/CourseCard';
import { useUserStore } from '../store/userStore';
import { useCourseStore } from '../store/courseStore';

export const SavedCoursesPage = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const courses = useCourseStore((state) => state.courses);

  // If no currentUser, render nothing
  if (!currentUser) return null;

  // Fallback to an empty array if currentUser.savedCourses is undefined
  const savedCourses = courses.filter(course =>
    currentUser.savedCourses?.includes(course.id) || [] // If savedCourses is undefined, fallback to an empty array
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-20 p-8">
        <h1 className="text-2xl font-bold mb-6">Saved Courses</h1>
        {savedCourses.length === 0 ? (
          <p className="text-gray-600">No saved courses yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
