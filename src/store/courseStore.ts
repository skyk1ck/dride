import create from 'zustand';
import axios from 'axios';
import { Course } from '../types';

interface CourseState {
  courses: Course[];
  error: string | null;
  userRole: string | null;
  setCourses: (courses: Course[]) => void;
  fetchCourses: () => void;
  loadCourses: () => Promise<void>;
  addCourse: (course: Course) => void;
  updateCourse: (id: number, course: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: number) => void;
  updateStudentCount: (id: number) => Promise<void>;
  updateRating: (id: number, newRating: number) => Promise<void>;
  setUserRole: (role: string) => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  error: null,
  userRole: null,

  setCourses: (courses) => set({ courses }),

  setUserRole: (role) => set({ userRole: role }),

  
  loadCourses: async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/courses');
      const fetchedCourses = response.data;

      
      const existingCourses = get().courses;
      const newCourses = fetchedCourses.filter((course: Course) =>
        !existingCourses.some((existingCourse) => existingCourse.id === course.id)
      );

      if (newCourses.length > 0) {
        const updatedCourses = [...existingCourses, ...newCourses];
        set({ courses: updatedCourses }); 
      } else {
        console.log("No new courses to add.");
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      set({ error: 'Failed to load courses from the database.' });
    }
  },

  
  fetchCourses: async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/courses');
      const fetchedCourses = response.data;

      const existingCourses = get().courses;

      
      const newCourses = fetchedCourses.filter((course: Course) =>
        !existingCourses.some((existingCourse) => existingCourse.id === course.id)
      );

      if (newCourses.length > 0) {
        const updatedCourses = [...existingCourses, ...newCourses];
        set({ courses: updatedCourses }); 
      } else {
        console.log("No new courses to add.");
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      set({ error: 'Failed to fetch courses. Please try again later.' });
    }
  },

  addCourse: (course) => {
    const existingCourses = get().courses;

    
    const isDuplicate = existingCourses.some((existingCourse) => existingCourse.id === course.id);

    if (isDuplicate) {
      console.warn('Course already exists, not adding it again.');
      return; 
    }

    const updatedCourses = [...existingCourses, course];
    set({ courses: updatedCourses });
  },

  updateCourse: async (id, updatedFields) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/courses/${id}`, updatedFields);
      const updatedCourse = response.data;

      const updatedCourses = get().courses.map((course) =>
        course.id === id ? { ...course, ...updatedCourse } : course
      );
      set({ courses: updatedCourses });
    } catch (error) {
      console.error('Error updating course:', error);
    }
  },

  deleteCourse: (courseId) => {
    const updatedCourses = get().courses.filter((course) => course.id !== courseId);
    set({ courses: updatedCourses });
  },

  updateStudentCount: async (id) => {
    const updatedCourses = get().courses.map((course) =>
      course.id === id ? { ...course, students: course.students + 1 } : course
    );
    set({ courses: updatedCourses });
  },

  updateRating: async (id, newRating) => {
    const updatedCourses = get().courses.map((course) =>
      course.id === id
        ? {
            ...course,
            rating: (course.rating * course.students + newRating) / (course.students + 1),
          }
        : course
    );
    set({ courses: updatedCourses });
  },
}));













