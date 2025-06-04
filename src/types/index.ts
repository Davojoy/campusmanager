import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher' | 'student' | null;

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string;
}

export interface Student {
  id: string; // Corresponds to user UID
  firstName: string;
  lastName: string;
  email: string; 
  dateOfBirth?: string; 
  enrollmentDate?: string;
  photoUrl?: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  teacherId?: string; // UID of teacher
  studentIds?: string[];
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  gradeValue: string;
  comments?: string;
  term?: string; // e.g., "Fall 2024"
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string; // ISO string date
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface Announcement {
  id:string;
  title: string;
  originalContent: string;
  studentContent?: string; // AI generated
  teacherContent?: string; // AI generated
  administratorContent?: string; // AI generated
  createdAt: Timestamp;
  createdBy: string; // Admin UID
}
