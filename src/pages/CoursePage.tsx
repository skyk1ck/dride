import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, BookmarkPlus, BookmarkMinus } from 'lucide-react';
import { useCourseStore } from '../store/courseStore';
import { useUserStore } from '../store/userStore';
import axios from 'axios';

export const CoursePage = () => {
  const { id } = useParams();
  const { courses, updateRating } = useCourseStore();
  const { currentUser, saveCourse, unsaveCourse, rateCourse, enrollCourse } = useUserStore();
  const [course, setCourse] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [isCourseSaved, setIsCourseSaved] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Retrieve the token dynamically from localStorage
  const token = localStorage.getItem('authToken'); // Use the token stored during login

  useEffect(() => {
    if (!token) return; // If there's no token, don't fetch data

    // Fetch course data
    axios.get(`http://localhost:5000/api/courses/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
      .then(response => {
        setCourse(response.data);
      })
      .catch(error => console.error('Error fetching course data:', error));

    // Fetch course comments
    axios.get(`http://localhost:5000/api/courses/${id}/comments`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
      .then(response => {
        setComments(response.data);
      })
      .catch(error => console.error('Error fetching comments:', error));

    // Check if the course is saved and if the user is enrolled
    if (currentUser) {
      // Check saved status
      axios.get(`http://localhost:5000/api/courses/${id}/saved`, {
        params: { userId: currentUser.id },
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
        .then(response => {
          setIsCourseSaved(response.data.saved);
        })
        .catch(error => console.error('Error checking saved status:', error));

      // Check enrollment status
      axios.get(`http://localhost:5000/api/courses/${id}/enrolled`, {
        params: { userId: currentUser.id },
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
        .then(response => {
          setIsEnrolled(response.data.enrolled);
        })
        .catch(error => console.error('Error checking enrollment status:', error));
    }
  }, [id, currentUser, token]);  // Ensure that `token` changes trigger the effect

  const handleSaveToggle = () => {
    if (currentUser) {
      if (isCourseSaved) {
        // Unsave course
        axios.post(`http://localhost:5000/api/courses/${id}/unsave`, { userId: currentUser.id }, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
          .then(() => setIsCourseSaved(false))
          .catch(error => console.error('Error unsaving course:', error));
      } else {
        // Save course
        axios.post(`http://localhost:5000/api/courses/${id}/save`, { userId: currentUser.id }, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
          .then(() => setIsCourseSaved(true))
          .catch(error => console.error('Error saving course:', error));
      }
    }
  };

  const handleRating = (rating) => {
    if (currentUser && course.id) {
      rateCourse(course.id, rating);
      updateRating(course.id, rating);
    }
  };

  const handleEnroll = () => {
    if (currentUser && course.id && !isEnrolled) {
      enrollCourse(course.id);
    }
  };

  const handleComment = () => {
    if (currentUser && comment.trim()) {
      // Post a comment
      axios.post(`http://localhost:5000/api/courses/${id}/comments`, { username: currentUser.username, text: comment }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
        .then(() => {
          setComments([...comments, { user: currentUser.username, text: comment }]);
          setComment('');
        })
        .catch(error => console.error('Error posting comment:', error));
    }
  };

  if (!course) {
    return <div>Course not found</div>;
  }

  const userRating = currentUser?.courseRatings[course.id];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-20 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {currentUser && (
              <button
                onClick={handleSaveToggle}
                className="flex items-center gap-2 text-gray-600 hover:text-black"
              >
                {isCourseSaved ? (
                  <BookmarkMinus className="w-5 h-5" />
                ) : (
                  <BookmarkPlus className="w-5 h-5" />
                )}
                {isCourseSaved ? 'Saved' : 'Save Course'}
              </button>
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
                  <span className="ml-2">⭐ {course.rating.toFixed(1)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Students:</span>
                  <span className="ml-2">{course.students.toLocaleString()}</span>
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
            <h2 className="text-xl font-semibold mb-4">Course Content</h2>
            <ul className="list-disc pl-6">
              {course.syllabus.map((item, index) => (
                <li key={index} className="mb-2">{item}</li>
              ))}
            </ul>
          </div>

          {currentUser && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Comments</h2>
              <div className="mb-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <button
                  onClick={handleComment}
                  className="mt-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Post Comment
                </button>
              </div>
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={index} className="border-b pb-4">
                    <p className="font-medium">{comment.user}</p>
                    <p className="text-gray-600">{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

