import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseStore } from '../store/courseStore';
import { useUserStore } from '../store/userStore';
import { Category } from '../types';
import { Trash2 } from 'lucide-react';

export const AdminPage = () => {
  const navigate = useNavigate();
  const { courses, addCourse, deleteCourse } = useCourseStore();
  const { users, addUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'add'>('courses');
  const [formData, setFormData] = useState({
    title: '',
    category: 'IT & Software' as Category,
    description: '',
    videoUrl: '',
    syllabus: '',
    instructors: 'Admin',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isTokenReady, setIsTokenReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setIsTokenReady(true);
    } else {
      alert('Please log in to manage courses');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (isTokenReady && token) {
      const fetchCourses = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/courses', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            data.forEach((course: any) => {
              // Prevent duplicate courses from being added
              if (!courses.find((c) => c.id === course.id)) {
                addCourse(course);
              }
            });
          } else {
            throw new Error('Failed to fetch courses');
          }
        } catch (err) {
          setError('Failed to fetch courses');
        }
      };
  
      const fetchUsers = async () => {
        try {
          const res = await fetch('http://localhost:5000/api/users', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            data.forEach((user: any) => {
              // Prevent duplicate users from being added
              if (!users.find((u) => u.id === user.id)) {
                addUser(user);
              }
            });
          } else {
            throw new Error('Failed to fetch users');
          }
          setLoading(false);
        } catch (err) {
          setError('Failed to fetch users');
          setLoading(false);
        }
      };
  
      fetchCourses();
      fetchUsers();
    }
  }, [isTokenReady, token, addCourse, addUser, courses, users]);  // Added `courses` and `users` as dependencies
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }
  
    if (!formData.title || !formData.description || !formData.videoUrl || !formData.syllabus) {
      setError('Please fill in all required fields.');
      return;
    }
  
    const payload = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      video_url: formData.videoUrl,
      syllabus: formData.syllabus.split('\n'),
      instructors: formData.instructors.split(',').map((i) => i.trim()),
    };
  
    try {
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
  
      const result = await res.json();
  
      if (res.ok) {
        addCourse({
          id: result.id,
          ...formData,
          rating: 5,
          students: 0,
          syllabus: payload.syllabus,
          instructors: payload.instructors,
        });
        setFormData({
          title: '',
          category: 'IT & Software',
          description: '',
          videoUrl: '',
          syllabus: '',
          instructors: 'Admin',
        });
        setActiveTab('courses');
        alert('Course added successfully');
      } else {
        setError(result.message || 'Failed to add course');
      }
    } catch (err) {
      console.error("Error details:", err); 
      setError('Error occurred while adding course');
    }
  };
  

  const handleDelete = async (id: number) => {
    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        deleteCourse(id);
        alert('Course deleted successfully');
      } else {
        const result = await res.json();
        alert(result.message || 'Failed to delete course');
      }
    } catch (err) {
      alert('Error occurred while deleting course');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-20 p-8">
        <div className="mb-8 flex gap-4">
          {['courses', 'users', 'add'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full ${activeTab === tab ? 'bg-black text-white' : 'bg-white'}`}
            >
              {tab === 'courses' ? 'Manage Courses' : tab === 'users' ? 'Users' : 'Add Course'}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-8">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {activeTab === 'courses' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Manage Courses</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4">Title</th>
                        <th className="text-left py-4">Category</th>
                        <th className="text-left py-4">Students</th>
                        <th className="text-left py-4">Rating</th>
                        <th className="text-left py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={`${course.id}-${index}`} className="border-b">
                          <td className="py-4">{course.title}</td>
                          <td>{course.category}</td>
                          <td>{course.students}</td>
                          <td>⭐ {course.rating.toFixed(1)}</td>
                          <td>
                            <button onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-800">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Users</h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4">Username</th>
                      <th className="py-4">Joined</th>
                      <th className="py-4">Courses</th>
                      <th className="py-4">Avg Rating</th>
                      <th className="py-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={`${user.id}-${index}`} className="border-b">
                        <td className="py-4">{user.username || 'Unknown'}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>{user.enrolledCourses ? user.enrolledCourses.length : 0}</td>
                        <td>{user.avgRating || 'N/A'}</td>
                        <td>{user.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'add' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Add New Course</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" htmlFor="title">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" htmlFor="category">
                      Category
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="IT & Software">IT & Software</option>
                      <option value="Business">Business</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" htmlFor="videoUrl">
                      Video URL
                    </label>
                    <input
                      type="url"
                      id="videoUrl"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" htmlFor="syllabus">
                      Syllabus (separate items with new lines)
                    </label>
                    <textarea
                      id="syllabus"
                      value={formData.syllabus}
                      onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2" htmlFor="instructors">
                      Instructors (comma-separated)
                    </label>
                    <input
                      type="text"
                      id="instructors"
                      value={formData.instructors}
                      onChange={(e) => setFormData({ ...formData, instructors: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    Add Course
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};



































