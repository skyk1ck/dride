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
  });

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to manage courses');
        return;
      }

      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const coursesData = await response.json();
        coursesData.forEach((course: any) => {
          addCourse(course);
        });
      } else {
        alert('Failed to fetch courses');
      }
    };
    fetchCourses();
  }, [addCourse]);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to manage users');
        return;
      }

      const response = await fetch('http://localhost:5000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const usersData = await response.json();
        usersData.forEach((user: any) => {
          addUser(user);
        });
      } else {
        alert('Failed to fetch users');
      }
    };
    fetchUsers();
  }, [addUser]);

  // Submit form data to backend API to save the course
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }

    const response = await fetch('http://localhost:5000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: formData.title,
        category: formData.category,
        description: formData.description,
        video_url: formData.videoUrl,
        syllabus: formData.syllabus.split('\n'),
      }),
    });

    const result = await response.json();

    if (response.ok) {
      addCourse({
        id: result.id.toString(),
        ...formData,
        students: 0,
        rating: 5.0,
        syllabus: formData.syllabus.split('\n'),
        instructors: ['Admin'],
      });
      setActiveTab('courses');
      alert('Course added successfully');
    } else {
      if (response.status === 403) {
        alert('You are not authorized to add a course. Please check your credentials.');
      } else {
        alert(result.error || 'Failed to add course');
      }
    }
  };

  const handleDelete = async (courseId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in again.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this course?')) {
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        deleteCourse(courseId);
        alert('Course deleted successfully');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete course');
      }
    }
  };

  // Check for duplicate course IDs (for debugging)
  const checkForDuplicates = (courses: any[]) => {
    const seen = new Set();
    return courses.filter(course => {
      if (seen.has(course.id)) {
        return false; // Filter out duplicates
      } else {
        seen.add(course.id);
        return true;
      }
    });
  };

  // Use the filtered courses to avoid duplicates in rendering
  const filteredCourses = checkForDuplicates(courses);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-20 p-8">
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-full ${activeTab === 'courses' ? 'bg-black text-white' : 'bg-white'}`}
          >
            Manage Courses
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full ${activeTab === 'users' ? 'bg-black text-white' : 'bg-white'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-full ${activeTab === 'add' ? 'bg-black text-white' : 'bg-white'}`}
          >
            Add Course
          </button>
        </div>

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
                  {filteredCourses.map((course) => (
                    <tr key={`course-${course.id}-${course.title}`} className="border-b">
                      <td className="py-4">{course.title}</td>
                      <td>{course.category}</td>
                      <td>{course.students}</td>
                      <td>⭐ {course.rating.toFixed(1)}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
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
            <h2 className="text-2xl font-bold mb-6">Manage Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4">Username</th>
                    <th className="text-left py-4">Registered</th>
                    <th className="text-left py-4">Enrolled Courses</th>
                    <th className="text-left py-4">Ratings</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={`user-${user.id}`} className="border-b">
                      <td className="py-4">{user.username}</td>
                      <td>{new Date(parseInt(user.id)).toLocaleDateString()}</td>
                      <td>{user.enrolledCourses.length}</td>
                      <td>{user.courseRatings ? Object.keys(user.courseRatings).length : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Add New Course</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
              >
                <option>IT & Software</option>
                <option>Business</option>
                <option>Design</option>
                <option>Marketing</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Video URL</label>
              <input
                type="url"
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Syllabus</label>
              <textarea
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.syllabus}
                onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-black text-white rounded-lg"
            >
              Add Course
            </button>
          </form>
        )}
      </div>
    </div>
  );
};



















