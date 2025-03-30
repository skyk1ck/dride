import create from 'zustand';
import axios from 'axios';
import { SecureStorage } from '../lib/storage';
import { Course } from '../types';

interface CourseState {
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  fetchCourses: () => void;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (id: number, course: Partial<Course>) => Promise<void>;
  deleteCourse: (id: number) => Promise<void>;
  updateStudentCount: (id: number) => Promise<void>;
  updateRating: (id: number, newRating: number) => Promise<void>;
  loadCourses: () => Promise<void>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  
  // Set courses to the state
  setCourses: (courses) => set({ courses }),

  // Load courses from SecureStorage (local storage)
  loadCourses: async () => {
    const localCourses = (await SecureStorage.getData('courses')) || [];
    set({ courses: localCourses });
  },

  // Fetch courses from the backend (API)
  fetchCourses: async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/courses');
      set({ courses: response.data });
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  },

  // Add a new course
  addCourse: async (course) => {
    const updatedCourses = [...get().courses, course];
    await SecureStorage.setData('courses', updatedCourses);
    set({ courses: updatedCourses });
  },

  // Update an existing course
  updateCourse: async (id, updatedFields) => {
    const updatedCourses = get().courses.map((course) =>
      course.id === id ? { ...course, ...updatedFields } : course
    );
    await SecureStorage.setData('courses', updatedCourses);
    set({ courses: updatedCourses });
  },

  // Delete a course
  deleteCourse: async (id) => {
    const updatedCourses = get().courses.filter((course) => course.id !== id);
    await SecureStorage.setData('courses', updatedCourses);
    set({ courses: updatedCourses });
  },

  // Increment the student count for a course
  updateStudentCount: async (id) => {
    const updatedCourses = get().courses.map((course) =>
      course.id === id ? { ...course, students: course.students + 1 } : course
    );
    await SecureStorage.setData('courses', updatedCourses);
    set({ courses: updatedCourses });
  },

  // Update the rating of a course
  updateRating: async (id, newRating) => {
    const updatedCourses = get().courses.map((course) =>
      course.id === id
        ? {
            ...course,
            rating: (course.rating * course.students + newRating) / (course.students + 1),
          }
        : course
    );
    await SecureStorage.setData('courses', updatedCourses);
    set({ courses: updatedCourses });
  },
}));

