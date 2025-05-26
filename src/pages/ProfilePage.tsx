import React, { useState, useRef, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { currentUser, setUsers, updateAvatar } = useUserStore();
  const { courses, setCourses, deleteCourse } = useCourseStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'admin'>('profile');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, coursesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/user'),
          axios.get('http://localhost:5000/api/courses'),
        ]);
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
      setPreviewUrl(currentUser.avatar || null);
    }
  }, [currentUser]);

  useEffect(() => {
    console.log('Is Authenticated:', isAuthenticated);
    console.log('Current User:', currentUser);
    console.log('User Loading:', userLoading);
  }, [isAuthenticated, currentUser, userLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser?.id) return;

    const file = e.target.files?.[0];
    if (!file) return;

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

  const saveCourse = async (courseId: string) => {
    if (!currentUser?.id) return;

    try {
      const response = await axios.post(`http://localhost:5000/api/courses/${courseId}/save`, {
        userId: currentUser.id,
      });
      console.log('Course saved:', response.data);
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

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

  if (userLoading || !currentUser) {
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
              onClick={() => {
                setActiveTab('admin');
                navigate('/admin');
              }}
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
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-gray-600 hover:text-black"
                  >
                    Change Avatar
                  </button>
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







