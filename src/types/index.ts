export type Category = 'Media' | 'IT & Software' | 'Business';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  savedCourses: string[];
  courseRatings: Record<string, number>;
  enrolledCourses: string[];
}

export interface Course {
  id: string;
  title: string;
  category: Category;
  description: string;
  videoUrl: string;
  students: number;
  rating: number;
  syllabus: string[];
  instructors: string[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  date: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  avatar?: string;
}