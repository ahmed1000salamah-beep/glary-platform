export type UserRole = 'student' | 'parent' | 'teacher' | 'secretary';

export type ParentType = 'father' | 'mother';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type HomeworkStatus = 'completed' | 'incomplete' | 'not_submitted';

export interface ExamRecord {
  id: string;
  title: string;
  date: string;
  score: number;
  maxScore: number;
  gradeRank?: number;
  totalStudents?: number;
  feedback?: string;
  percentage?: number;
  type: 'comprehensive' | 'monthly' | 'weekly_quiz' | 'grammar_test';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  lectureTitle: string;
  status: AttendanceStatus;
  entryTime?: string;
  homeworkStatus: HomeworkStatus;
  vocabScore?: number; // e.g. 10
  vocabMaxScore?: number; // e.g. 10
  notes?: string;
}

export interface TeacherNote {
  id: string;
  date: string;
  author: string; // e.g. "مستر أحمد المعاطي"
  content: string;
  category: 'academic' | 'behavior' | 'encouragement' | 'warning';
}

export interface PaymentRecord {
  id: string;
  month: string;
  amount: number;
  status: 'paid' | 'pending';
  paymentDate?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface VocabRecord {
  id: string;
  date: string;
  unit: string;
  score: number;
  maxScore: number;
  notes?: string;
  passed?: boolean;
}

export interface Student {
  id: string;
  code: string; // e.g. "STD-101"
  fullName: string;
  gradeLevel: string; // e.g. "الصف الثالث الثانوي"
  groupName: string; // e.g. "مجموعة الأحد والأربعاء - 5:00 م"
  branch?: 'كفر سعد' | 'دمياط' | string; // Branch / Center
  age?: number; // e.g. 17 or 18
  nfcCardCode?: string; // NFC Card UID / access code on card
  phone: string;
  parentPhone?: string; // Phone number for father or mother
  fatherPhone?: string; // Dedicated father phone number
  motherPhone?: string; // Dedicated mother phone number
  // Constraint: Only 1 father and 1 mother per student
  fatherId?: string;
  fatherName?: string;
  motherId?: string;
  motherName?: string;
  avatarUrl?: string;
  notes: TeacherNote[];
  exams: ExamRecord[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  vocabHistory?: VocabRecord[];
  isMock?: boolean;
  password?: string; // Student password
  activeHomework?: {
    id: string;
    title: string;
    deadline: string;
    status: HomeworkStatus;
    instructions: string;
    lectureNumber?: number;
    assignedDate?: string;
    assignedToGroup?: string;
    assignedToGrade?: string;
  }[];
}

export interface LessonVideo {
  id: string;
  title: string;
  lectureNumber: number;
  gradeLevel: string;
  branch?: string; // 'كفر سعد' | 'دمياط' | 'الكل'
  groupName?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  targetStudentCode?: string;
  durationMinutes: number; // e.g. 90 (ساعة ونصف)
  videoUrl?: string; // Embed or video source
  fileName?: string; // Local uploaded video file name
  fileSize?: string; // e.g. "120 MB"
  fileDataUrl?: string; // Local file data URL or blob
  description: string;
  dateAdded: string;
  unit: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface OnlineQuizSession {
  id: string;
  title: string;
  type: 'homework' | 'quiz' | 'lecture_file' | 'lecture_video';
  gradeLevel?: string;
  branch?: string; // 'كفر سعد' | 'دمياط' | 'الكل'
  groupName?: string;
  quizLink?: string; // External or online form link (Google Form / Microsoft Form / Quiz platform)
  lectureNumber: number;
  durationMinutes: number;
  totalScore: number;
  questions: ExamQuestion[];
  isLockedDueToCheating?: boolean;
}

export interface StudentQuizSubmission {
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  completedAt: string;
  autoSubmittedOnExit: boolean;
  answers: Record<number, number>;
}

export interface ParentAccount {
  id: string;
  type: ParentType; // 'father' | 'mother'
  fullName: string;
  phone: string;
  email?: string;
  passwordHash: string;
  authProvider: 'local' | 'google';
  studentCodes: string[]; // Linked students codes
  createdAt: string;
}

export interface PlatformNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  targetRole?: UserRole | 'all';
  targetStudentCode?: string;
  targetStudentId?: string;
  targetGroup?: string;
  targetGrade?: string;
  targetBranch?: string;
  icon?: string;
  type: 'grade' | 'attendance' | 'announcement' | 'warning' | 'payment';
}

export interface StudyMaterial {
  id: string;
  title: string;
  gradeLevel: string;
  branch?: string; // 'كفر سعد' | 'دمياط' | 'الكل'
  groupName?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  targetStudentCode?: string;
  unit?: string;
  fileName?: string;
  fileSize?: string;
  fileDataUrl?: string;
  category: 'Grammar' | 'Vocabulary' | 'Comprehension' | 'Revision Notes';
  fileUrl?: string;
  description: string;
  dateAdded: string;
  downloadCount: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  location: 'دمياط' | 'كفر سعد';
  schedule: string; // e.g. "الأحد والأربعاء - 5:00 م"
  gradeLevel: string; // e.g. "الصف الثالث الثانوي"
  monthlyPrice: number; // e.g. 350
  notes?: string;
  createdAt?: string;
}

export interface GroupDailyAttendance {
  id: string;
  groupId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  nfcCardCode?: string;
  date: string; // YYYY-MM-DD
  exactTime: string; // e.g. "04:15:32 م"
  homeworkStatus: 'completed' | 'incomplete' | 'not_submitted';
  recitationScore: number; // e.g. 10
  recitationMaxScore?: number; // e.g. 10
  notes?: string;
}
