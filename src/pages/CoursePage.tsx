import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, BookmarkPlus } from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useUserStore } from '../store/userStore';
import axios from 'axios';
import config from '../components/config';

export const CoursePage = () => {
  const API_URL = config.API_URL;
  const { id } = useParams();
  const { courses, updateRating, fetchCourses } = useCourseStore();
  const { currentUser, enrollCourse } = useUserStore();
  const [course, setCourse] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [isCourseSaved, setIsCourseSaved] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!courses.length) {
        await fetchCourses();
      }

      let currentCourse = courses.find((c) => c.id === parseInt(id));
      if (!currentCourse) {
        const response = await axios.get(`${API_URL}/courses/${id}`);
        currentCourse = response.data;
      }

      setCourse(currentCourse);

      if (currentUser?.token) {
        try {
          const savedRes = await axios.get(`${API_URL}/courses/${id}/saved`, {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
            },
          });
          setIsCourseSaved(savedRes.data.saved);
        } catch (err) {
         
        }
      }

      try {
        const savedCountRes = await axios.get(`${API_URL}/courses/${id}/saved-count`);
        setSavedCount(savedCountRes.data.count);
      } catch (err) {
       
      }
    };

    fetchData();
  }, [id, currentUser, courses]);

  const handleSaveToggle = async (courseId: number) => {
    const token = useUserStore.getState().getAuthToken();

    if (!token) return;

    try {
      await axios.post(`${API_URL}/courses/${courseId}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsCourseSaved(true);
      setSavedCount(prev => prev + 1);
    } catch (error: any) {
    
    }
  };

  const handleRating = (rating: number) => {
    if (currentUser && course?.id) {
      updateRating(course.id, rating);
      axios.post(
        `${API_URL}/courses/${course.id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${currentUser.token}` } }
      ).catch(() => {
        
      });
    }
  };

  const handleEnroll = () => {
    if (currentUser && course?.id && !isEnrolled) {
      enrollCourse(course.id);
      setIsEnrolled(true);
    }
  };

  const handleComment = () => {
    if (currentUser && comment.trim()) {
      axios.post(`${API_URL}/courses/${id}/comments`, {
        username: currentUser.username,
        text: comment
      })
        .then(() => {
          setComments([...comments, { user: currentUser.username, text: comment }]);
          setComment('');
        })
        .catch(() => {
         
        });
    }
  };

  if (!course) {
    return <div>Course not found</div>;
  }

  const userRating = currentUser?.courseRatings?.[course.id];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{course.title}</h1>

            {currentUser && (
              isCourseSaved ? (
                <div className="flex items-center gap-2 text-green-600 font-semibold">
                  <BookmarkPlus className="w-5 h-5" />
                  This course is already saved
                </div>
              ) : (
                <button
                  onClick={() => handleSaveToggle(course.id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-black"
                >
                  <BookmarkPlus className="w-5 h-5" />
                  Save Course
                </button>
              )
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Category:</span>
                <span className="ml-2">{course.category}</span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Rating:</span>
                  <span className="ml-2">⭐ {course.rating?.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Students:</span>
                  <span className="ml-2">{savedCount}</span>
                </div>
              </div>
            </div>

            {currentUser && !isEnrolled && (
              <button
                onClick={handleEnroll}
                className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 mb-4"
              >
                Start Course
              </button>
            )}

            {isEnrolled && (
              <div className="mb-4">
                <a
                  href={course.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 inline-block text-center"
                >
                  Watch Course
                </a>
              </div>
            )}

            {currentUser && isEnrolled && !userRating && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Rate this course:</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRating(rating)}
                      className="text-gray-400 hover:text-yellow-400"
                    >
                      <Star className="w-6 h-6" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-700">{course.description}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div key={index} className="flex items-start">
                  <span className="font-medium">{comment.user}:</span>
                  <p className="ml-2 text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>

            {currentUser && (
              <div className="mt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full p-2 border rounded-lg mb-2"
                  placeholder="Add a comment..."
                />
                <button
                  onClick={handleComment}
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Post Comment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

















