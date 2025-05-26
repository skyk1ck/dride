import React, { useEffect, useState } from 'react';
import { CourseCard } from '../components/CourseCard';
import { useUserStore } from '../store/userStore';
import { useCourseStore } from '../store/courseStore';
import { Link } from 'react-router-dom';

export const SavedCoursesPage = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const fetchSavedCourses = useUserStore((state) => state.fetchSavedCourses);
  const courses = useCourseStore((state) => state.courses);
  const [savedCourseDetails, setSavedCourseDetails] = useState<any[]>([]);

  useEffect(() => {
    const loadSavedCourses = async () => {
      
      const savedCourses = await fetchSavedCourses();

      
      const details = courses.filter((course) =>
        savedCourses.some((saved: any) => saved.id === course.id)
      );

      setSavedCourseDetails(details);
    };

    if (currentUser) {
      loadSavedCourses();
    }
  }, [currentUser, courses]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-20 p-8">
        <h1 className="text-2xl font-bold mb-6">Saved Courses</h1>
        {savedCourseDetails.length === 0 ? (
          <>
            <p className="text-gray-600">You don't have any saved courses yet.</p>
            <div className="mt-4">
              <Link to="/courses" className="text-blue-500 hover:text-blue-700">
                Explore courses
              </Link>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCourseDetails.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};






