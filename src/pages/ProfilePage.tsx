import React, { useState, useRef, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import axios from 'axios';

export const ProfilePage = () => {
  const { currentUser, setUsers, updateAvatar } = useUserStore();
  const { courses, setCourses, deleteCourse } = useCourseStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');

  // Fetch users and courses data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching user and course data...');
        const [usersResponse, coursesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/user'),
          axios.get('http://localhost:5000/api/courses'),
        ]);
        console.log('Users fetched:', usersResponse.data);
        console.log('Courses fetched:', coursesResponse.data);
        setUsers(usersResponse.data);
        setCourses(coursesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setUserLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    } else {
      setUserLoading(false);
    }
  }, [isAuthenticated, setCourses, setUsers]);

  useEffect(() => {
    if (currentUser) {
      console.log('Current user loaded:', currentUser);
      setPreviewUrl(currentUser.avatar || null);
    }
  }, [currentUser]);

  // Handle avatar file change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser?.id) {
      console.error('User not found or invalid file.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) {
      console.error('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      setLoading(true);

      try {
        await axios.post(`http://localhost:5000/api/user/${currentUser.id}/avatar`, { avatar: base64String });
        updateAvatar(currentUser.id, base64String);
        setPreviewUrl(base64String);
      } catch (error) {
        console.error('Error updating avatar:', error);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Handle saving a course
  const saveCourse = async (courseId: string) => {
    if (!currentUser?.id) {
      console.error("Error: User is not logged in or ID is missing.");
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5000/api/courses/${courseId}/save`, {
        userId: currentUser.id,
      });
      console.log('Course saved:', response.data);
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  // Handle deleting a course
  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`http://localhost:5000/api/courses/${courseId}`);
        deleteCourse(courseId);
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  // Debug log for user and authentication
  console.log('Is Authenticated:', isAuthenticated);
  console.log('Current User:', currentUser);

  // Ensure the user is available before rendering the profile page
  if (userLoading || !currentUser || !isAuthenticated) {
    console.log('Loading state or user is not available.');
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="ml-20 p-8">
        {isAuthenticated && (
          <div className="mb-8 flex gap-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-full ${activeTab === 'profile' ? 'bg-black text-white' : 'bg-white'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-full ${activeTab === 'admin' ? 'bg-black text-white' : 'bg-white'}`}
            >
              Admin Panel
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Profile</h1>
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{currentUser.username ?? 'Guest'}</h2>
                  {currentUser && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-gray-600 hover:text-black"
                    >
                      Change Avatar
                    </button>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {loading && <p>Loading...</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




