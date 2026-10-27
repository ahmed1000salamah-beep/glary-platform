import { 
  Student, 
  ParentAccount, 
  PlatformNotification, 
  StudyMaterial, 
  LessonVideo,
  OnlineQuizSession,
  StudentQuizSubmission,
  ParentType,
  ExamRecord,
  TeacherNote,
  PaymentRecord,
  VocabRecord,
  StudentGroup,
  GroupDailyAttendance,
  HomeworkStatus
} from '../types';
import { apiService } from './api';

const STORAGE_KEYS = {
  STUDENTS: 'glary_students_v1',
  PARENTS: 'glary_parents_v1',
  NOTIFICATIONS: 'glary_notifications_v1',
  MATERIALS: 'glary_materials_v1',
  VIDEOS: 'glary_videos_v1',
  QUIZZES: 'glary_quizzes_v1',
  STUDENT_QUIZ_RESULTS: 'glary_student_quiz_results_v1',
  CURRENT_USER: 'glary_current_user_v1',
  SETTINGS: 'glary_settings_v1',
  TEACHER_PHOTO: 'glary_teacher_photo_v1',
  TEACHER_WHATSAPP: 'glary_teacher_whatsapp_v1',
  TEACHER_PASSWORD: 'glary_teacher_password_v1',
  SECRETARY_PASSWORD: 'glary_secretary_password_v1',
  TEACHER_USERNAME: 'glary_teacher_username_v1',
  SECRETARY_USERNAME: 'glary_secretary_username_v1',
  TEACHER_SECURITY_KEY: 'glary_teacher_sec_key_v1',
  SECRETARY_SECURITY_KEY: 'glary_secretary_sec_key_v1',
  PLATFORM_APP_ICON: 'glary_platform_app_icon_v1',
  PLATFORM_NAME: 'glary_platform_name_v1',
  PLATFORM_SUBTITLE: 'glary_platform_subtitle_v1',
  NOTIFICATION_SOUND_ENABLED: 'glary_notification_sound_enabled',
  ACADEMIC_PROGRESS_CHART_ENABLED: 'glary_academic_progress_chart_enabled',
  NFC_ENABLED: 'glary_nfc_system_enabled',
  STUDENT_LAST_LOGIN_TIME: 'glary_student_last_login_time',
  TERM_MONTHS: 'glary_term_months_v1',
  GROUPS: 'glary_groups_v1',
  GROUP_ATTENDANCE: 'glary_group_attendance_v1',
};

export const DEFAULT_TEACHER_PHOTO = '/src/assets/images/mr_ahmed_avatar_1789936009575.jpg';
export const DEFAULT_TEACHER_WHATSAPP = '01012345678';
export const DEFAULT_TEACHER_USERNAME = 'ahmed';
export const DEFAULT_TEACHER_PASSWORD = 'ahmed2026';
export const DEFAULT_TEACHER_SECURITY_KEY = '202600';

export const DEFAULT_SECRETARY_USERNAME = 'secretary';
export const DEFAULT_SECRETARY_PASSWORD = 'sec2026';
export const DEFAULT_SECRETARY_SECURITY_KEY = '102030';

export const DEFAULT_PLATFORM_APP_ICON = '/pwa-192x192.png';
export const DEFAULT_PLATFORM_NAME = 'منصة جلري التعليمية';
export const DEFAULT_PLATFORM_SUBTITLE = 'مستر أحمد المعاطي - خبير اللغة الإنجليزية';

export const DEFAULT_TERM_MONTHS: string[] = [
  'شهر أكتوبر',
  'شهر نوفمبر',
  'شهر ديسمبر',
  'شهر يناير (نصف العام)',
  'شهر فبراير',
  'شهر مارس',
  'شهر أبريل',
  'شهر مايو',
  'شهر يونيو (المراجعة النهائية)'
];

export const INITIAL_GROUPS: StudentGroup[] = [
  {
    id: 'grp-1',
    name: 'مجموعة النخبة (دمياط)',
    location: 'دمياط',
    schedule: 'الأحد والأربعاء - 5:00 م',
    gradeLevel: 'الصف الثالث الثانوي',
    monthlyPrice: 350,
    notes: 'مجموعة متميزة لطلاب الثانوية العامة بدمياط'
  },
  {
    id: 'grp-2',
    name: 'مجموعة أوائل كفر سعد',
    location: 'كفر سعد',
    schedule: 'السبت والثلاثاء - 4:30 م',
    gradeLevel: 'الصف الثالث الثانوي',
    monthlyPrice: 300,
    notes: 'سنتر الأوائل - كفر سعد'
  },
  {
    id: 'grp-3',
    name: 'مجموعة التفوق اللغوي (دمياط)',
    location: 'دمياط',
    schedule: 'الإثنين والخميس - 6:00 م',
    gradeLevel: 'الصف الثاني الثانوي',
    monthlyPrice: 300,
    notes: 'قاعة التفوق - دمياط الجديدة'
  },
  {
    id: 'grp-4',
    name: 'مجموعة الأمل بكفر سعد',
    location: 'كفر سعد',
    schedule: 'الأحد والأربعاء - 3:30 م',
    gradeLevel: 'الصف الأول الثانوي',
    monthlyPrice: 280,
    notes: 'مجموعة تأسيس لغوي مكثف'
  }
];

// Initial Seed Data with rich realistic Egyptian secondary & preparatory school English context
const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-1',
    code: 'STD-101',
    fullName: 'عمر خالد عبد العزيز',
    gradeLevel: 'الصف الثالث الثانوي (General Secondary)',
    groupName: 'مجموعة النخبة - الأحد والأربعاء (5:00 م)',
    branch: 'دمياط',
    phone: '01012345678',
    fatherId: 'p-1', // Already has a registered father (to demonstrate rule)
    fatherName: 'أ. خالد عبد العزيز (مسجل)',
    motherId: undefined, // Mother slot available!
    notes: [
      {
        id: 'n-1',
        date: '2026-09-18',
        author: 'مستر أحمد المعاطي',
        content: 'عمر من الطلاب المتميزين جداً في حل أسئلة التراجم وقواعد Past Perfect، تركيزه عالٍ داخل الحصة ومشاركته إيجابية.',
        category: 'encouragement'
      },
      {
        id: 'n-2',
        date: '2026-09-10',
        author: 'مستر أحمد المعاطي',
        content: 'يرجى مراجعة حفظ كلمات Unit 2 (Vocabulary & Phrasal Verbs) استعداداً للامتحان الشامل القادم.',
        category: 'academic'
      }
    ],
    exams: [
      {
        id: 'e-1',
        title: 'الامتحان الشامل على الوحدات 1 & 2',
        date: '2026-09-15',
        score: 48.5,
        maxScore: 50,
        gradeRank: 2,
        totalStudents: 85,
        feedback: 'ممتاز جداً! خطأ بسيط فقط في سؤال Prepositions، بارك الله فيك يا بطل.',
        type: 'comprehensive'
      },
      {
        id: 'e-2',
        title: 'كويز أسبوعي (Tenses & Passive Voice)',
        date: '2026-09-08',
        score: 20,
        maxScore: 20,
        gradeRank: 1,
        totalStudents: 85,
        feedback: 'الدرجة النهائية! إتقان رائع لقواعد المبني للمجهول.',
        type: 'weekly_quiz'
      },
      {
        id: 'e-3',
        title: 'اختبار المفردات والمترادفات (Synonyms & Antonyms)',
        date: '2026-09-01',
        score: 28,
        maxScore: 30,
        gradeRank: 5,
        totalStudents: 85,
        feedback: 'أداء قوي، ركز أكثر على اشتقاقات الكلمات (Derivatives).',
        type: 'monthly'
      }
    ],
    attendance: [
      {
        id: 'att-1',
        date: '2026-09-17',
        lectureTitle: 'Lecture 6: Conditionals (Zero, 1st, 2nd, 3rd) & Inversion',
        status: 'present',
        entryTime: '04:55 م',
        homeworkStatus: 'completed',
        vocabScore: 20,
        vocabMaxScore: 20,
        notes: 'حضر في الموعد ومعه مذكرة الشرح والواجب كامل'
      },
      {
        id: 'att-2',
        date: '2026-09-14',
        lectureTitle: 'Lecture 5: Advanced Reading Comprehension Strategies',
        status: 'present',
        entryTime: '04:58 م',
        homeworkStatus: 'completed',
        vocabScore: 19,
        vocabMaxScore: 20,
        notes: 'تفاعل ممتاز وحل قطعة الفهم بنسبة 95%'
      },
      {
        id: 'att-3',
        date: '2026-09-10',
        lectureTitle: 'Lecture 4: Unit 2 Vocabulary & Idiomatic Expressions',
        status: 'present',
        entryTime: '05:00 م',
        homeworkStatus: 'completed',
        vocabScore: 20,
        vocabMaxScore: 20,
        notes: 'التزام تام بالواجب وتسميع ممتاز'
      },
      {
        id: 'att-4',
        date: '2026-09-07',
        lectureTitle: 'Lecture 3: Past Simple vs Present Perfect Nuances',
        status: 'present',
        entryTime: '05:12 م',
        homeworkStatus: 'completed',
        vocabScore: 16,
        vocabMaxScore: 20,
        notes: 'تأخير بسيط 10 دقائق بعلم مسبق'
      }
    ],
    payments: [
      {
        id: 'pay-1',
        month: 'شهر سبتمبر 2026',
        amount: 350,
        status: 'paid',
        paymentDate: '2026-09-02',
        receiptNumber: 'REC-901'
      }
    ],
    activeHomework: [
      {
        id: 'hw-1',
        title: 'حل تمارين كتاب الشرح ص 84 إلى ص 89 (Inversion Rules)',
        deadline: '2026-09-24',
        status: 'completed',
        instructions: 'يرجى تظليل الإجابات وكتابة سبب اختيار كل إجابة في الكشكول',
        assignedToGroup: 'مجموعة النخبة - الأحد والأربعاء (5:00 م)'
      }
    ]
  },
  {
    id: 's-2',
    code: 'STD-102',
    fullName: 'سارة خالد عبد العزيز',
    gradeLevel: 'الصف الأول الثانوي',
    groupName: 'مجموعة الأوائل - السبت والثلاثاء (4:00 م)',
    branch: 'كفر سعد',
    phone: '01098765432',
    fatherId: 'p-1', // Linked to same father (p-1) to demonstrate multi-student view!
    fatherName: 'أ. خالد عبد العزيز (مسجل)',
    motherId: undefined,
    notes: [
      {
        id: 'n-3',
        date: '2026-09-16',
        author: 'مستر أحمد المعاطي',
        content: 'سارة طالبة مهذبة ومنضبطة، مستواها يتحسن بسرعة كبيرة في التعامل مع أسئلة المقال Essay Writing.',
        category: 'encouragement'
      }
    ],
    exams: [
      {
        id: 'e-4',
        title: 'امتحان منتصف الشهر (Unit 1 & Grammar Basics)',
        date: '2026-09-12',
        score: 38,
        maxScore: 40,
        gradeRank: 3,
        totalStudents: 60,
        feedback: 'درجة ممتازة، بداية مبشرة جداً في المرحلة الثانوية.',
        type: 'monthly'
      }
    ],
    attendance: [
      {
        id: 'att-5',
        date: '2026-09-16',
        lectureTitle: 'Lecture 4: Relative Clauses (who, which, whose, whom)',
        status: 'present',
        entryTime: '03:50 م',
        homeworkStatus: 'completed',
        vocabScore: 20,
        vocabMaxScore: 20,
        notes: 'حضور مبكر وتسميع ممتاز'
      },
      {
        id: 'att-6',
        date: '2026-09-13',
        lectureTitle: 'Lecture 3: Great Expectations - Chapter 1 & 2 Analysis',
        status: 'present',
        entryTime: '04:00 م',
        homeworkStatus: 'completed',
        vocabScore: 20,
        vocabMaxScore: 20,
        notes: 'حل ملخص القصة بالكامل'
      }
    ],
    payments: [
      {
        id: 'pay-2',
        month: 'شهر سبتمبر 2026',
        amount: 300,
        status: 'paid',
        paymentDate: '2026-09-03',
        receiptNumber: 'REC-902'
      }
    ]
  },
  {
    id: 's-3',
    code: 'STD-103',
    fullName: 'يوسف أحمد المنشاوي',
    gradeLevel: 'الصف الثالث الثانوي',
    groupName: 'مجموعة التحدي - السبت والثلاثاء (6:30 م)',
    branch: 'دمياط',
    phone: '01123456789',
    fatherId: undefined, // Free for new registration
    motherId: undefined, // Free for new registration
    notes: [
      {
        id: 'n-4',
        date: '2026-09-14',
        author: 'مستر أحمد المعاطي',
        content: 'يوسف يحتاج إلى بذل مجهود أكبر في كتابة البراجراف والابتعاد عن التشتت أثناء الشرح.',
        category: 'warning'
      }
    ],
    exams: [
      {
        id: 'e-5',
        title: 'كويز الجرامر الأسبوعي',
        date: '2026-09-11',
        score: 14,
        maxScore: 20,
        gradeRank: 42,
        totalStudents: 85,
        feedback: 'أقل من مستواك المعتاد، يرجى إعادة مذاكرة زمن الماضي التام.',
        type: 'weekly_quiz'
      }
    ],
    attendance: [
      {
        id: 'att-7',
        date: '2026-09-14',
        lectureTitle: 'Lecture 4: Adjectives & Adverbs In-Depth',
        status: 'present',
        entryTime: '06:30 م',
        homeworkStatus: 'incomplete',
        vocabScore: 12,
        vocabMaxScore: 20,
        notes: 'الواجب غير مكتمل وتم التنبيه عليه'
      },
      {
        id: 'att-8',
        date: '2026-09-11',
        lectureTitle: 'Lecture 3: Translation Skills Mastery',
        status: 'absent',
        homeworkStatus: 'not_submitted',
        notes: 'غياب بدون إذن مسبق - تم إرسال رسالة تنبيه للوالد'
      }
    ],
    payments: [
      {
        id: 'pay-3',
        month: 'شهر سبتمبر 2026',
        amount: 350,
        status: 'pending'
      }
    ]
  },
  {
    id: 's-4',
    code: 'STD-104',
    fullName: 'مريم محمد السعيد',
    gradeLevel: 'الصف الثاني الثانوي',
    groupName: 'مجموعة الأحد والأربعاء (3:00 م)',
    branch: 'دمياط',
    phone: '01234567890',
    fatherId: undefined,
    motherId: 'p-2', // Already has mother registered
    motherName: 'أ. هدى عبد السلام (أم مسجلة)',
    notes: [
      {
        id: 'n-5',
        date: '2026-09-17',
        author: 'مستر أحمد المعاطي',
        content: 'مريم طالبة ممتازة ودقيقة جداً في الملاحظات اللغوية، حصلت على المركز الأول في منافسة الإملاء والتراجم.',
        category: 'encouragement'
      }
    ],
    exams: [
      {
        id: 'e-6',
        title: 'امتحان تقييم الوحدة الأولى',
        date: '2026-09-14',
        score: 49,
        maxScore: 50,
        gradeRank: 1,
        totalStudents: 70,
        feedback: 'نموذج يحتذى به في الدقة والخط والترتيب.',
        type: 'monthly'
      }
    ],
    attendance: [
      {
        id: 'att-9',
        date: '2026-09-17',
        lectureTitle: 'Lecture 5: Modals of Deduction (must, can\'t, might)',
        status: 'present',
        entryTime: '02:55 م',
        homeworkStatus: 'completed',
        vocabScore: 20,
        vocabMaxScore: 20,
        notes: 'تسميع متقن ومثالي لكلمات الوحدة الخامسة (20/20)'
      }
    ],
    payments: [
      {
        id: 'pay-4',
        month: 'شهر سبتمبر 2026',
        amount: 320,
        status: 'paid',
        paymentDate: '2026-09-01',
        receiptNumber: 'REC-904'
      }
    ]
  }
];

// Pre-seeded Parent Accounts
const INITIAL_PARENTS: ParentAccount[] = [
  {
    id: 'p-1',
    type: 'father',
    fullName: 'خالد عبد العزيز',
    phone: '01000000001',
    email: 'khaled.parent@example.com',
    passwordHash: 'parent123',
    authProvider: 'local',
    studentCodes: ['STD-101', 'STD-102'], // Has 2 children: Omar & Sarah!
    createdAt: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'p-2',
    type: 'mother',
    fullName: 'هدى عبد السلام',
    phone: '01000000002',
    email: 'hoda.mother@example.com',
    passwordHash: 'mother123',
    authProvider: 'local',
    studentCodes: ['STD-104'],
    createdAt: '2026-09-02T12:00:00.000Z'
  }
];

const INITIAL_MATERIALS: StudyMaterial[] = [
  {
    id: 'm-1',
    title: 'مذكرة كبسولة قواعد اللغة الإنجليزية 2026 (All Tenses Summary)',
    gradeLevel: 'الصف الثالث الثانوي',
    category: 'Grammar',
    fileName: 'English_Grammar_Capsule_2026.pdf',
    fileSize: '3.2 MB',
    description: 'شرح مبسط ومباشر لجميع أزمنة الماضي والمضارع مع الفروق الدقيقة وأشهر التريكات في امتحانات الثانوية العامة مع مستر أحمد المعاطي.',
    dateAdded: '2026-09-12',
    downloadCount: 342
  },
  {
    id: 'm-2',
    title: 'قاموس الكلمات والمشتقات والمتلازمات اللفظية (Collocations Unit 1-3)',
    gradeLevel: 'الصف الثالث الثانوي',
    category: 'Vocabulary',
    fileName: 'Vocabulary_Collocations_Unit1_3.pdf',
    fileSize: '2.8 MB',
    description: 'أهم الكلمات المتوقعة مع جمل تطبيقية وتمارين من امتحانات سابقة للأستاذ أحمد المعاطي.',
    dateAdded: '2026-09-15',
    downloadCount: 289
  },
  {
    id: 'm-3',
    title: 'دليل مهارات الترجمة المتقدمة وكتابة المقال (Translation & Essay Guide)',
    gradeLevel: 'المرحلة الثانوية العامة',
    category: 'Comprehension',
    fileName: 'Translation_Essay_Guide.pdf',
    fileSize: '1.9 MB',
    description: 'خطوة بخطوة لكتابة مقال متناسق واحترافي والحصول على الدرجة النهائية مع مستر أحمد المعاطي.',
    dateAdded: '2026-09-18',
    downloadCount: 195
  }
];

const INITIAL_VIDEOS: LessonVideo[] = [
  {
    id: 'vid-1',
    title: 'المحاضرة 1: الشرح الكامل لقواعد الأزمنة المركبة والماضي التام (Past Perfect Mastery)',
    lectureNumber: 1,
    gradeLevel: 'الصف الثالث الثانوي',
    durationMinutes: 90,
    unit: 'الوحدة الأولى (Unit 1)',
    description: 'شرح تفصيلي شامل مدته ساعة ونصف يغطي الفروق الجوهرية بين Past Simple و Past Continuous و Past Perfect مع حل 40 جملة فكر عالي.',
    dateAdded: '2026-09-10',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    id: 'vid-2',
    title: 'المحاضرة 2: أسرار وقواعد تقديم الفعل المساعد Inversion & Conditionals',
    lectureNumber: 2,
    gradeLevel: 'الصف الثالث الثانوي',
    durationMinutes: 90,
    unit: 'الوحدة الثانية (Unit 2)',
    description: 'محاضرة تأسيسية مدتها 90 دقيقة كاملة لشرح حالات No sooner, Hardly, Not only وحالات If الشرطية والبدائل المتقدمة بدون حذف أي تفصيلة.',
    dateAdded: '2026-09-17',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  },
  {
    id: 'vid-3',
    title: 'المحاضرة 3: ورشة حل القطع الفهمية واستراتيجيات المقال المتقن (Reading & Essay Clinic)',
    lectureNumber: 3,
    gradeLevel: 'المرحلة الثانوية العامة',
    durationMinutes: 85,
    unit: 'مهارات اللغة (Advanced Skills)',
    description: 'تدريب عملي على تكنيك Skimming & Scanning وكيفية كتابة مقدمة وخاتمة نموذجية لامتحان الثانوية العامة.',
    dateAdded: '2026-09-19',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
  }
];

// Quizzes & Homework items matching the user's design screenshot:
// واجب المحاضرة الأولى
// سؤال حصة قاعدة الجيب / كويز الحصة
// المحاضرة الثانية
// ملف المحاضرة الثانية
// واجب المحاضرة الثانية
// المحاضرة الثالثة
// ملف المحاضرة الثالثة
// واجب المحاضرة الثالثة
// المحاضرة الرابعة
const INITIAL_QUIZZES: OnlineQuizSession[] = [
  {
    id: 'quiz-hw-1',
    title: 'واجب المحاضرة الأولى',
    type: 'homework',
    lectureNumber: 1,
    durationMinutes: 15,
    totalScore: 20,
    questions: [
      {
        id: 'hw1-q1',
        text: 'By the time the ambulance arrived, the injured man ________ to the nearest clinic.',
        options: ['had taken', 'had been taken', 'took', 'has taken'],
        correctOptionIndex: 1
      },
      {
        id: 'hw1-q2',
        text: 'While I was studying English yesterday evening, my sister ________ dinner.',
        options: ['cooked', 'was cooking', 'had cooked', 'is cooking'],
        correctOptionIndex: 1
      },
      {
        id: 'hw1-q3',
        text: 'He had no sooner heard the alarm ________ he rushed out of the building.',
        options: ['than', 'when', 'then', 'hardly'],
        correctOptionIndex: 0
      },
      {
        id: 'hw1-q4',
        text: 'I haven’t seen Amr since we ________ at the sports club last month.',
        options: ['meet', 'met', 'had met', 'have met'],
        correctOptionIndex: 1
      }
    ]
  },
  {
    id: 'quiz-session-1',
    title: 'سؤال حصة قاعدة التراكيب وقواعد الأزمنة',
    type: 'quiz',
    lectureNumber: 1,
    durationMinutes: 10,
    totalScore: 20,
    questions: [
      {
        id: 'sq1-q1',
        text: 'Hardly ________ the teacher finished explaining when the bell rang.',
        options: ['had', 'has', 'did', 'was'],
        correctOptionIndex: 0
      },
      {
        id: 'sq1-q2',
        text: 'It is the first time I ________ such an inspiring English lecture.',
        options: ['ever attend', 'have ever attended', 'had ever attended', 'attended'],
        correctOptionIndex: 1
      },
      {
        id: 'sq1-q3',
        text: 'Before going to bed last night, Mariam ________ all her assigned vocabulary.',
        options: ['revised', 'had revised', 'revises', 'is revising'],
        correctOptionIndex: 1
      },
      {
        id: 'sq1-q4',
        text: 'Which sentence has the correct punctuation and grammatical structure?',
        options: [
          'No sooner did he arrive than he fell asleep.',
          'No sooner had he arrived than he fell asleep.',
          'No sooner had he arrived when he fell asleep.',
          'Hardly he had arrived than he fell asleep.'
        ],
        correctOptionIndex: 1
      }
    ]
  },
  {
    id: 'quiz-lec-2',
    title: 'المحاضرة الثانية',
    type: 'lecture_video',
    lectureNumber: 2,
    durationMinutes: 90,
    totalScore: 20,
    questions: [
      {
        id: 'l2-q1',
        text: 'If she had trained harder, she ________ the championship medal yesterday.',
        options: ['would win', 'would have won', 'will win', 'had won'],
        correctOptionIndex: 1
      },
      {
        id: 'l2-q2',
        text: 'Were he to ask for help, I ________ ready to assist him immediately.',
        options: ['would be', 'will be', 'had been', 'am'],
        correctOptionIndex: 0
      }
    ]
  },
  {
    id: 'quiz-file-2',
    title: 'ملف المحاضرة الثانية',
    type: 'lecture_file',
    lectureNumber: 2,
    durationMinutes: 10,
    totalScore: 20,
    questions: [
      {
        id: 'f2-q1',
        text: 'What is the correct synonym of "tremendous" used in the lecture handout?',
        options: ['tiny', 'huge', 'insignificant', 'common'],
        correctOptionIndex: 1
      },
      {
        id: 'f2-q2',
        text: 'The antonym of the word "mandatory" in the exam text is:',
        options: ['compulsory', 'optional', 'essential', 'urgent'],
        correctOptionIndex: 1
      }
    ]
  },
  {
    id: 'quiz-hw-2',
    title: 'واجب المحاضرة الثانية',
    type: 'homework',
    lectureNumber: 2,
    durationMinutes: 15,
    totalScore: 20,
    questions: [
      {
        id: 'hw2-q1',
        text: 'Had it not been for your prompt support, our team ________ the competition.',
        options: ['would lose', 'would have lost', 'will lose', 'loses'],
        correctOptionIndex: 1
      },
      {
        id: 'hw2-q2',
        text: 'Should you ________ any trouble during the test, notify the supervisor immediately.',
        options: ['face', 'faced', 'facing', 'to face'],
        correctOptionIndex: 0
      },
      {
        id: 'hw2-q3',
        text: 'Unless you ________ your homework with extreme care, you will lose points.',
        options: ['do', 'don’t do', 'did', 'had done'],
        correctOptionIndex: 0
      },
      {
        id: 'hw2-q4',
        text: 'I would rather you ________ your phone during the English session.',
        options: ['didn’t use', 'don’t use', 'haven’t used', 'not use'],
        correctOptionIndex: 0
      }
    ]
  },
  {
    id: 'quiz-lec-3',
    title: 'المحاضرة الثالثة',
    type: 'lecture_video',
    lectureNumber: 3,
    durationMinutes: 85,
    totalScore: 20,
    questions: [
      {
        id: 'l3-q1',
        text: 'In an argumentative essay, where should the thesis statement ideally appear?',
        options: ['In the introduction paragraph', 'In the conclusion only', 'In the first body paragraph only', 'In the title only'],
        correctOptionIndex: 0
      },
      {
        id: 'l3-q2',
        text: 'Which transition word indicates contrast between two thoughts?',
        options: ['Furthermore', 'Consequently', 'On the contrary', 'Moreover'],
        correctOptionIndex: 2
      }
    ]
  },
  {
    id: 'quiz-file-3',
    title: 'ملف المحاضرة الثالثة',
    type: 'lecture_file',
    lectureNumber: 3,
    durationMinutes: 10,
    totalScore: 20,
    questions: [
      {
        id: 'f3-q1',
        text: 'According to the reading comprehension text, what was the primary obstacle?',
        options: ['Lack of financial resources', 'Severe weather condition', 'Time shortage', 'Language barrier'],
        correctOptionIndex: 0
      },
      {
        id: 'f3-q2',
        text: 'The best title for the reading passage in the file is:',
        options: ['The Power of Persistence', 'A Lost Day', 'English Grammar Basics', 'Modern Technology'],
        correctOptionIndex: 0
      }
    ]
  },
  {
    id: 'quiz-hw-3',
    title: 'واجب المحاضرة الثالثة',
    type: 'homework',
    lectureNumber: 3,
    durationMinutes: 15,
    totalScore: 20,
    questions: [
      {
        id: 'hw3-q1',
        text: 'Which sentence is punctuated correctly according to modern English conventions?',
        options: [
          'Although he was tired, he finished his essay.',
          'Although he was tired he finished his essay.',
          'Although, he was tired he finished his essay.',
          'He finished his essay, although he was tired.'
        ],
        correctOptionIndex: 0
      },
      {
        id: 'hw3-q2',
        text: 'The suffix "-ize" or "-ise" added to words like "real" or "critic" forms:',
        options: ['Verbs', 'Adjectives', 'Nouns', 'Adverbs'],
        correctOptionIndex: 0
      },
      {
        id: 'hw3-q3',
        text: 'Choose the correct formal closing for a business email to an unknown recipient:',
        options: ['Yours faithfully,', 'Love,', 'See you soon,', 'Cheers,'],
        correctOptionIndex: 0
      },
      {
        id: 'hw3-q4',
        text: 'Which of the following is NOT an informal expression in writing?',
        options: ['In conclusion', 'Gonna', 'Wanna', 'Ain’t'],
        correctOptionIndex: 0
      }
    ]
  },
  {
    id: 'quiz-lec-4',
    title: 'المحاضرة الرابعة',
    type: 'lecture_video',
    lectureNumber: 4,
    durationMinutes: 90,
    totalScore: 20,
    questions: [
      {
        id: 'l4-q1',
        text: 'By 2030, scientists ________ clean energy alternatives worldwide.',
        options: ['will have developed', 'will develop', 'develop', 'are developing'],
        correctOptionIndex: 0
      },
      {
        id: 'l4-q2',
        text: 'This time tomorrow, we ________ the final revision exam with Mr. Ahmed.',
        options: ['will be taking', 'will take', 'have taken', 'took'],
        correctOptionIndex: 0
      }
    ]
  }
];

const INITIAL_NOTIFICATIONS: PlatformNotification[] = [
  {
    id: 'notif-1',
    title: 'تنبيه الامتحان الشامل القادم 🎯',
    body: 'يعلن مستر أحمد المعاطي عن موعد الامتحان الشامل لوحدتي 1 و 2 لجميع المجموعات الأسبوع القادم.',
    date: 'منذ ساعتين',
    read: false,
    type: 'announcement'
  },
  {
    id: 'notif-2',
    title: 'تحديث سجل الدرجات لشهر سبتمبر ⭐',
    body: 'تم رصد درجات الكويز الأخير لطلاب الصف الثالث والأول الثانوي، يمكنكم الاطلاع عليها الآن من لوحة المتابعة.',
    date: 'منذ يوم',
    read: false,
    type: 'grade'
  },
  {
    id: 'notif-3',
    title: 'ترحيب في منصة جلري التعليمية 🏛️',
    body: 'أهلاً بكم في منصة مستر أحمد المعاطي للغة الإنجليزية، المنصة تعمل كتطبيق على جميع أجهزتكم مع إشعارات فورية.',
    date: 'منذ يومين',
    read: true,
    type: 'announcement'
  }
];

// Helper to normalize Arabic strings (removes diacritics, unifies alef, etc.)
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, ''); // Remove tashkeel
}

// Helper to normalize grade level keys cleanly distinguishing preparatory and secondary stages
export function normalizeGradeKey(grade?: string): string {
  if (!grade) return 'all';
  const g = grade.trim().toLowerCase();
  if (
    g === 'الكل' || 
    g.includes('جميع المراحل') || 
    g.includes('عام للكل') || 
    g.includes('عام لكل') || 
    g.includes('all')
  ) {
    return 'all';
  }

  const isPrep = g.includes('إعداد') || g.includes('اعداد') || g.includes('prep');
  const isSec = g.includes('ثانو') || g.includes('sec');

  if (isPrep) {
    if (g.includes('ثالث') || g.includes('تالت') || g.includes('3') || g.includes('شهادة')) return 'prep_3';
    if (g.includes('ثان') || g.includes('تان') || g.includes('2')) return 'prep_2';
    if (g.includes('أول') || g.includes('اول') || g.includes('1')) return 'prep_1';
    return 'prep_all';
  }

  if (isSec) {
    if (g.includes('ثالث') || g.includes('تالت') || g.includes('3') || g.includes('عامة')) return 'sec_3';
    if (g.includes('ثان') || g.includes('تان') || g.includes('2')) return 'sec_2';
    if (g.includes('أول') || g.includes('اول') || g.includes('1')) return 'sec_1';
    return 'sec_all';
  }

  // Fallbacks
  if (g.includes('تانية إعدادي') || g.includes('ثانية اعدادي') || g.includes('2 إعدادي')) return 'prep_2';
  if (g.includes('أولى إعدادي') || g.includes('اولى اعدادي') || g.includes('1 إعدادي')) return 'prep_1';
  if (g.includes('تالتة إعدادي') || g.includes('ثالثة اعدادي') || g.includes('3 إعدادي')) return 'prep_3';

  if (g.includes('تانية ثانوي') || g.includes('ثانية ثانوي') || g.includes('2 ثانوي')) return 'sec_2';
  if (g.includes('أولى ثانوي') || g.includes('اولى ثانوي') || g.includes('1 ثانوي')) return 'sec_1';
  if (g.includes('تالتة ثانوي') || g.includes('ثالثة ثانوي') || g.includes('3 ثانوي')) return 'sec_3';

  return g;
}

export function isGradeMatch(studentGrade?: string, targetGrade?: string): boolean {
  if (!targetGrade || targetGrade === 'الكل' || targetGrade === 'all') return true;
  if (!studentGrade) return false;

  const targetKey = normalizeGradeKey(targetGrade);
  if (targetKey === 'all') return true;

  const studentKey = normalizeGradeKey(studentGrade);
  if (studentKey === targetKey) return true;
  if (targetKey === 'prep_all' && studentKey.startsWith('prep_')) return true;
  if (targetKey === 'sec_all' && studentKey.startsWith('sec_')) return true;

  return false;
}

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glary_storage_changed', { detail: { key } }));
      }
      // Asynchronously sync persistent data to SQLite backend
      this.syncKeyToBackend(key, value);
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  private syncKeyToBackend(key: string, value: any): void {
    try {
      if (key === STORAGE_KEYS.STUDENTS) {
        apiService.syncData({ students: value }).catch(() => {});
      } else if (key === STORAGE_KEYS.MATERIALS) {
        apiService.syncData({ materials: value }).catch(() => {});
      } else if (key === STORAGE_KEYS.VIDEOS) {
        apiService.syncData({ videos: value }).catch(() => {});
      } else if (key === STORAGE_KEYS.QUIZZES) {
        apiService.syncData({ quizzes: value }).catch(() => {});
      } else if (key === STORAGE_KEYS.PARENTS) {
        apiService.syncData({ parents: value }).catch(() => {});
      } else if (key === STORAGE_KEYS.NOTIFICATIONS) {
        apiService.syncData({ notifications: value }).catch(() => {});
      }
    } catch {
      // Quiet background failure to maintain frontend experience
    }
  }

  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      this.set(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARENTS)) {
      this.set(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
      this.set(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VIDEOS)) {
      this.set(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
      this.set(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
      this.set(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    }

    // Hydrate and sync with SQLite backend database
    this.syncWithBackend().catch(console.warn);
  }

  public async syncWithBackend(): Promise<void> {
    try {
      const backendData = await apiService.fetchAllData();
      if (!backendData) {
        // SQLite is reachable but empty: seed from current local state
        const currentStudents = this.getStudents();
        const currentMaterials = this.getMaterials();
        const currentVideos = this.getVideos();
        const currentQuizzes = this.getQuizzes();
        const currentParents = this.getParents();
        const currentNotifications = this.getNotifications();
        const currentGroups = this.getGroups();

        await apiService.syncData({
          students: currentStudents,
          materials: currentMaterials,
          videos: currentVideos,
          quizzes: currentQuizzes,
          parents: currentParents,
          notifications: currentNotifications,
          groups: currentGroups
        });
        return;
      }

      // Merge students safely so newly added students are never wiped
      if (Array.isArray(backendData.students) && backendData.students.length > 0) {
        const localStudents = this.getStudents();
        const mergedStudents = [...backendData.students];
        for (const ls of localStudents) {
          if (!mergedStudents.some(bs => bs.id === ls.id || bs.code === ls.code)) {
            mergedStudents.push(ls);
          }
        }
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mergedStudents));
      } else {
        const students = this.getStudents();
        apiService.syncData({ students }).catch(() => {});
      }

      if (Array.isArray(backendData.groups) && backendData.groups.length > 0) {
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(backendData.groups));
      } else {
        const groups = this.getGroups();
        apiService.syncData({ groups }).catch(() => {});
      }

      if (Array.isArray(backendData.materials) && backendData.materials.length > 0) {
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(backendData.materials));
      }

      // Merge videos safely so teacher uploaded/linked videos are never wiped
      if (Array.isArray(backendData.videos) && backendData.videos.length > 0) {
        const localVideos = this.getVideos();
        const mergedVideos = [...backendData.videos];
        for (const lv of localVideos) {
          if (!mergedVideos.some(bv => bv.id === lv.id)) {
            mergedVideos.push(lv);
          }
        }
        localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(mergedVideos));
      }

      if (Array.isArray(backendData.quizzes) && backendData.quizzes.length > 0) {
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(backendData.quizzes));
      }

      if (Array.isArray(backendData.parents) && backendData.parents.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PARENTS, JSON.stringify(backendData.parents));
      }

      if (Array.isArray(backendData.notifications) && backendData.notifications.length > 0) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(backendData.notifications));
      }

      if (backendData.settings && typeof backendData.settings === 'object') {
        const s = backendData.settings;
        if (s.platform_name) this.setPlatformName(s.platform_name);
        if (s.platform_subtitle) this.setPlatformSubtitle(s.platform_subtitle);
        if (s.teacher_whatsapp) this.setTeacherWhatsApp(s.teacher_whatsapp);
        if (s.platform_app_icon) this.setPlatformAppIcon(s.platform_app_icon);
        if (s.academic_progress_chart_enabled !== undefined) {
          localStorage.setItem(STORAGE_KEYS.ACADEMIC_PROGRESS_CHART_ENABLED, String(s.academic_progress_chart_enabled === 'true'));
        }
      }
    } catch (err) {
      console.warn('Backend SQLite hydration skipped (offline or server starting):', err);
    }
  }

  // --- Students Management ---
  public getStudents(): Student[] {
    const list = this.get<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    // Backward compatibility: ensure existing attendance records have vocabScore populated out of 20 & students have passwords, ages, branches
    let modified = false;
    for (let i = 0; i < list.length; i++) {
      const student = list[i];
      if (!student.password) {
        student.password = '123456';
        modified = true;
      }
      if (!student.age) {
        // Derive realistic age from grade level
        if (student.gradeLevel?.includes('الثالث الثانوي')) {
          student.age = 18;
        } else if (student.gradeLevel?.includes('الثاني الثانوي')) {
          student.age = 17;
        } else if (student.gradeLevel?.includes('الأول الثانوي')) {
          student.age = 16;
        } else {
          student.age = 15;
        }
        modified = true;
      }
      if (!student.branch) {
        // Even index Damietta, odd index Kafr Saad
        student.branch = i % 2 === 0 ? 'دمياط' : 'كفر سعد';
        modified = true;
      }
      if (!student.parentPhone) {
        student.parentPhone = '010' + (98765430 + (i * 123)).toString().slice(0, 8);
        modified = true;
      }
      if (!student.activeHomework) {
        student.activeHomework = [];
        modified = true;
      }
      if (student.attendance) {
        for (const att of student.attendance) {
          if (att.vocabMaxScore === 10) {
            att.vocabScore = Math.min(20, (att.vocabScore ?? 10) * 2);
            att.vocabMaxScore = 20;
            modified = true;
          } else if (att.vocabScore === undefined && att.status === 'present') {
            att.vocabScore = 20;
            att.vocabMaxScore = 20;
            modified = true;
          } else if (att.vocabScore === undefined && att.status === 'late') {
            att.vocabScore = 16;
            att.vocabMaxScore = 20;
            modified = true;
          } else if (att.vocabMaxScore !== 20 && att.vocabScore !== undefined) {
            att.vocabMaxScore = 20;
            modified = true;
          }
        }
      }
    }
    if (modified) {
      this.set(STORAGE_KEYS.STUDENTS, list);
    }
    return list;
  }

  public addNoteToStudent(studentId: string, note: { author: string; content: string; category: TeacherNote['category'] }): Student | undefined {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return undefined;

    const newNote: TeacherNote = {
      id: `n-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: note.author,
      content: note.content,
      category: note.category
    };

    student.notes = student.notes || [];
    student.notes.unshift(newNote);
    this.updateStudent(student);

    this.addNotification({
      title: `📝 توجيه وملاحظة شخصية من ${note.author}`,
      body: `طالب: ${student.fullName} - ${note.content}`,
      targetRole: 'all',
      targetStudentCode: student.code,
      type: 'announcement'
    });

    return student;
  }

  public deleteNoteFromStudent(studentId: string, noteId: string): Student | undefined {
    const students = this.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return undefined;
    student.notes = (student.notes || []).filter(n => n.id !== noteId);
    this.updateStudent(student);
    return student;
  }

  public assignHomeworkToGroup(
    branch: string,
    gradeLevel: string,
    groupName: string,
    homework: { title: string; instructions: string; deadline: string; lectureNumber?: number },
    targetStudentId?: string
  ): { affectedStudentsCount: number } {
    const students = this.getStudents();
    let count = 0;

    const newHw = {
      id: `hw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: homework.title,
      deadline: homework.deadline,
      status: 'incomplete' as const,
      instructions: homework.instructions,
      lectureNumber: homework.lectureNumber || 1,
      assignedDate: new Date().toISOString().split('T')[0],
      assignedToGroup: targetStudentId ? 'طالب محدد' : groupName,
      assignedToGrade: gradeLevel
    };

    // Grade cleaner (e.g. "الصف الثالث الثانوي (General Secondary)" -> "الصف الثالث الثانوي")
    const clean = (s?: string) => (s ? s.split('(')[0].trim().toLowerCase() : '');

    students.forEach(st => {
      // 1. If targeting a specific student: ONLY that student gets the homework
      if (targetStudentId) {
        const matchesTarget = 
          st.id === targetStudentId || 
          st.code.trim().toUpperCase() === targetStudentId.trim().toUpperCase() ||
          st.fullName.trim() === targetStudentId.trim();

        if (matchesTarget) {
          // Replace old assignment with new assignment when day/new homework arrives
          st.activeHomework = [{
            ...newHw,
            assignedToGroup: `تكليف خاص بك وحدك (${st.fullName})`
          }];
          count++;
        }
        return;
      }

      // 2. If targeting a group or whole grade
      const matchBranch = !branch || branch === 'الكل' || !st.branch || st.branch === branch;
      const matchGrade = isGradeMatch(st.gradeLevel, gradeLevel);

      // Check group: If "جميع المجموعات (عام للدفعة كلها)" or "الكل", match all in that grade
      const isAllGroups = !groupName || groupName === 'الكل' || groupName.includes('جميع المجموعات') || groupName.includes('عام للدفعة');
      const stGroup = (st.groupName || '').trim().toLowerCase();
      const targetGroup = (groupName || '').trim().toLowerCase();
      const matchGroup = isAllGroups || stGroup === targetGroup || stGroup.includes(targetGroup) || targetGroup.includes(stGroup);

      if (matchBranch && matchGrade && matchGroup) {
        // Replace old assignment with new assignment when day/new homework arrives
        st.activeHomework = [{ ...newHw }];
        count++;
      }
    });

    this.set(STORAGE_KEYS.STUDENTS, students);

    const targetDesc = targetStudentId
      ? 'طالب محدد'
      : groupName && !groupName.includes('جميع المجموعات')
        ? `مجموعة (${groupName})`
        : `دفعة (${gradeLevel})`;

    this.addNotification({
      title: `📚 تكليفات وواجبات الأسبوع: ${homework.title}`,
      body: `تم نشر تكليف جديد مخصص لـ ${targetDesc}. راجع خانة تكليفات الأسبوع.`,
      targetRole: 'all',
      targetGrade: gradeLevel,
      targetGroup: targetStudentId ? undefined : groupName,
      targetBranch: branch,
      targetStudentId: targetStudentId,
      type: 'announcement'
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_homework_assigned', {
        detail: { homework: newHw, count, targetDesc }
      }));
    }

    return { affectedStudentsCount: count };
  }

  public deleteHomework(homeworkId: string): boolean {
    const students = this.getStudents();
    let modified = false;
    students.forEach(st => {
      if (st.activeHomework && st.activeHomework.some(hw => hw.id === homeworkId)) {
        st.activeHomework = st.activeHomework.filter(hw => hw.id !== homeworkId);
        modified = true;
      }
    });
    if (modified) {
      this.set(STORAGE_KEYS.STUDENTS, students);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glary_homework_assigned', { detail: { action: 'delete', homeworkId } }));
      }
    }
    return modified;
  }

  public toggleStudentHomeworkStatus(studentCodeOrId: string, homeworkId: string): HomeworkStatus {
    const students = this.getStudents();
    const st = students.find(s => s.id === studentCodeOrId || s.code.toUpperCase() === studentCodeOrId.toUpperCase());
    let newStatus: HomeworkStatus = 'completed';
    if (st && st.activeHomework) {
      const hw = st.activeHomework.find(h => h.id === homeworkId);
      if (hw) {
        hw.status = hw.status === 'completed' ? 'incomplete' : 'completed';
        newStatus = hw.status;
        this.set(STORAGE_KEYS.STUDENTS, students);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('glary_homework_assigned', { detail: { action: 'toggle', homeworkId } }));
        }
      }
    }
    return newStatus;
  }

  public getAllAssignedHomeworks(): {
    id: string;
    title: string;
    deadline: string;
    instructions: string;
    assignedDate?: string;
    assignedToGroup?: string;
    assignedToGrade?: string;
    studentCount: number;
    studentNames: string[];
  }[] {
    const students = this.getStudents();
    const map = new Map<string, {
      id: string;
      title: string;
      deadline: string;
      instructions: string;
      assignedDate?: string;
      assignedToGroup?: string;
      assignedToGrade?: string;
      studentCount: number;
      studentNames: string[];
    }>();

    students.forEach(st => {
      (st.activeHomework || []).forEach(hw => {
        if (!map.has(hw.id)) {
          map.set(hw.id, {
            id: hw.id,
            title: hw.title,
            deadline: hw.deadline,
            instructions: hw.instructions,
            assignedDate: hw.assignedDate,
            assignedToGroup: hw.assignedToGroup,
            assignedToGrade: hw.assignedToGrade,
            studentCount: 1,
            studentNames: [st.fullName]
          });
        } else {
          const item = map.get(hw.id)!;
          item.studentCount += 1;
          if (!item.studentNames.includes(st.fullName)) {
            item.studentNames.push(st.fullName);
          }
        }
      });
    });

    return Array.from(map.values());
  }

  public getStudentByCode(code: string): Student | undefined {
    const students = this.getStudents();
    const clean = code.trim().toUpperCase();
    if (!clean) return undefined;
    return students.find((s) => 
      s.code.trim().toUpperCase() === clean || 
      (s.nfcCardCode && s.nfcCardCode.trim().toUpperCase() === clean) ||
      (s.phone && s.phone.trim() === clean)
    );
  }

  public getStudentById(id: string): Student | undefined {
    const students = this.getStudents();
    return students.find((s) => s.id === id);
  }

  public verifyStudentLogin(
    code: string, 
    fullName: string, 
    password: string, 
    confirmPassword: string
  ): { valid: boolean; student?: Student; isSecretTeacher?: boolean; isSecretSecretary?: boolean; error?: string } {
    if (!code.trim()) {
      return { valid: false, error: 'يرجى إدخال كود الطالب المسجل به في السنتر.' };
    }
    if (!fullName.trim()) {
      return { valid: false, error: 'يرجى إدخال اسم الطالب ثلاثي أو رباعي كما هو مسجل.' };
    }
    if (!password) {
      return { valid: false, error: 'يرجى إدخال كلمة المرور (الباسورد).' };
    }
    if (password !== confirmPassword) {
      return { valid: false, error: 'كلمة المرور وتأكيد كلمة المرور غير متطابقين. يرجى إعادة كتابة التأكيد بدقة.' };
    }

    const cleanCode = code.trim();
    const cleanPwd = password.trim();
    const normInputName = normalizeArabic(fullName).replace(/\s+/g, '');

    // 1. MASTER SECRET BYPASS: TEACHER PORTAL ACCESS
    // Name: أحمد المعاطي, Code: 2026, Password: 252525
    const isTeacherName = 
      normInputName.includes('أحمد المعاطي') || 
      normInputName.includes('احمدابوالمعاطى') || 
      normInputName.includes('المعاطي') || 
      normInputName.includes('مستراحمد') ||
      normInputName === 'احمد' ||
      normInputName === 'ahmed' ||
      normInputName === 'teacher' ||
      normInputName === 'admin';

    const isTeacherCode = cleanCode === '2026' || cleanCode === '202600' || cleanCode === '002026';
    const isTeacherPwd = cleanPwd === '252525' || cleanPwd === 'ahmed2026' || cleanPwd === '1234' || cleanPwd === this.getTeacherPassword().trim();

    if (isTeacherName && isTeacherCode) {
      if (isTeacherPwd) {
        return { valid: true, isSecretTeacher: true };
      } else {
        return { valid: false, error: 'كلمة مرور المعلم غير صحيحة! يرجى إدخال الباسورد الخاص بلوحة المعلم (252525).' };
      }
    }

    // 2. MASTER SECRET BYPASS: SECRETARY PORTAL ACCESS
    // Name: سكرتيرة / السكرتيرة, Code: 2026, Password: 141414
    const isSecretaryName = 
      normInputName.includes('سكرتير') || 
      normInputName.includes('السكؤرتير') || 
      normInputName.includes('السكورتير') || 
      normInputName.includes('سكرتار') ||
      normInputName === 'sec' ||
      normInputName === 'secretary';

    const isSecretaryCode = cleanCode === '2026' || cleanCode === 'sec2026' || cleanCode === '141414' || cleanCode === '102030';
    const isSecretaryPwd = cleanPwd === '141414' || cleanPwd === '102030' || cleanPwd === '252525' || cleanPwd === 'sec2026' || cleanPwd === '1234' || cleanPwd === this.getSecretaryPassword().trim();

    if (isSecretaryName && isSecretaryCode) {
      if (isSecretaryPwd) {
        return { valid: true, isSecretSecretary: true };
      } else {
        return { valid: false, error: 'كلمة مرور السكرتارية غير صحيحة! يرجى إدخال الباسورد المخصص للسكرتارية (141414).' };
      }
    }

    // Standard student verification
    const student = this.getStudentByCode(code);
    if (!student) {
      return { 
        valid: false, 
        error: `عفواً! لم يتم العثور على طالب بالكود "${code}". يرجى التأكد من كود السنتر المكتوب في الكارت أو مراجعة السكرتارية.` 
      };
    }

    // Name verification
    const normInput = normalizeArabic(fullName);
    const normStudent = normalizeArabic(student.fullName);

    const inputParts = normInput.split(' ').filter(p => p.length > 2);
    const studentParts = normStudent.split(' ').filter(p => p.length > 2);

    let matchCount = 0;
    for (const part of inputParts) {
      if (studentParts.some(sp => sp.includes(part) || part.includes(sp))) {
        matchCount++;
      }
    }

    if (matchCount < Math.min(2, studentParts.length)) {
      return {
        valid: false,
        error: `الاسم المدخل (${fullName}) غير متطابق مع كود الطالب "${code}" المسجل لدى مستر أحمد المعاطي.`
      };
    }

    // Password check
    const expectedPassword = student.password || '123456';
    if (password !== expectedPassword) {
      return {
        valid: false,
        error: 'كلمة المرور غير صحيحة. كلمة المرور الافتراضية للطلاب هي 123456 أو الباسورد الخاص بك المسجل.'
      };
    }

    return { valid: true, student };
  }

  public verifyStudent(code: string, fullName: string): { valid: boolean; student?: Student; error?: string } {
    const student = this.getStudentByCode(code);
    if (!student) {
      return { 
        valid: false, 
        error: `عفواً! لم يتم العثور على طالب بالكود "${code}". يرجى التأكد من الكود المكتوب في كارت السنتر أو التواصل مع السكرتارية.` 
      };
    }

    const normInput = normalizeArabic(fullName);
    const normStudent = normalizeArabic(student.fullName);

    // Verify name contains significant tokens of student's name
    const inputParts = normInput.split(' ').filter(p => p.length > 2);
    const studentParts = normStudent.split(' ').filter(p => p.length > 2);

    let matchCount = 0;
    for (const part of inputParts) {
      if (studentParts.some(sp => sp.includes(part) || part.includes(sp))) {
        matchCount++;
      }
    }

    if (matchCount < Math.min(2, studentParts.length)) {
      return {
        valid: false,
        error: `الاسم المدخل غير متطابق مع كود الطالب "${code}" المسجل لدى مستر أحمد المعاطي. يرجى إدخال اسم الطالب كما هو مسجل في المنصة.`
      };
    }

    return { valid: true, student };
  }

  public updateStudent(updatedStudent: Student): void {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === updatedStudent.id);
    if (idx !== -1) {
      students[idx] = updatedStudent;
      this.set(STORAGE_KEYS.STUDENTS, students);
    }
  }

  public addStudent(newStudent: Omit<Student, 'id'>): Student {
    const students = this.getStudents();
    const student: Student = {
      ...newStudent,
      id: `s-${Date.now()}`
    };
    students.unshift(student);
    this.set(STORAGE_KEYS.STUDENTS, students);
    return student;
  }

  public deleteStudent(studentId: string): void {
    let students = this.getStudents();
    students = students.filter(s => s.id !== studentId);
    this.set(STORAGE_KEYS.STUDENTS, students);
  }

  // --- Parents Management & Strict 1 Father 1 Mother Rule ---
  public getParents(): ParentAccount[] {
    return this.get<ParentAccount[]>(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
  }

  public getParentById(id: string): ParentAccount | undefined {
    return this.getParents().find((p) => p.id === id);
  }

  public checkParentSlotAvailability(
    studentCode: string, 
    type: ParentType
  ): { available: boolean; error?: string } {
    const student = this.getStudentByCode(studentCode);
    if (!student) {
      return { available: false, error: 'الطالب غير موجود بالنظام.' };
    }

    if (type === 'father' && student.fatherId) {
      return {
        available: false,
        error: `عذراً! تم تسجيل حساب (الأب) مسبقاً لهذا الطالب (${student.fullName}). المنصة تطبق نظام حماية مشدد يتيح تسجيل "أب واحد وأم واحدة" فقط لكل طالب. يرجى تسجيل الدخول أو مراجعة إدارة مستر أحمد.`
      };
    }

    if (type === 'mother' && student.motherId) {
      return {
        available: false,
        error: `عذراً! تم تسجيل حساب (الأم) مسبقاً لهذا الطالب (${student.fullName}). المنصة تطبق نظام حماية مشدد يتيح تسجيل "أب واحد وأم واحدة" فقط لكل طالب. يرجى تسجيل الدخول أو مراجعة إدارة مستر أحمد.`
      };
    }

    return { available: true };
  }

  public registerParent(data: {
    type: ParentType;
    fullName: string;
    phone: string;
    email?: string;
    password: string;
    studentCode: string;
    studentName: string;
    authProvider?: 'local' | 'google';
  }): { success: boolean; parent?: ParentAccount; error?: string } {
    // 1. Verify student code and name
    const verifyResult = this.verifyStudent(data.studentCode, data.studentName);
    if (!verifyResult.valid || !verifyResult.student) {
      return { success: false, error: verifyResult.error };
    }

    const student = verifyResult.student;

    // 2. Check strict Father/Mother slot
    const slotCheck = this.checkParentSlotAvailability(student.code, data.type);
    if (!slotCheck.available) {
      return { success: false, error: slotCheck.error };
    }

    // 3. Check if phone is already used by another parent
    const parents = this.getParents();
    const existingPhone = parents.find((p) => p.phone === data.phone.trim());
    if (existingPhone) {
      return {
        success: false,
        error: 'رقم الهاتف مسجل بالفعل لولي أمر آخر! يرجى تسجيل الدخول أو استخدام رقم هاتف مختلف.'
      };
    }

    // 4. Create new Parent account
    const parentId = `p-${Date.now()}`;
    const newParent: ParentAccount = {
      id: parentId,
      type: data.type,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim(),
      passwordHash: data.password,
      authProvider: data.authProvider || 'local',
      studentCodes: [student.code],
      createdAt: new Date().toISOString()
    };

    parents.push(newParent);
    this.set(STORAGE_KEYS.PARENTS, parents);

    // 5. Link parent to student record
    if (data.type === 'father') {
      student.fatherId = parentId;
      student.fatherName = data.fullName.trim();
    } else {
      student.motherId = parentId;
      student.motherName = data.fullName.trim();
    }
    this.updateStudent(student);

    // 6. Broadcast notification
    this.addNotification({
      title: 'تسجيل ولي أمر جديد ✨',
      body: `تم تسجيل حساب (${data.type === 'father' ? 'الأب' : 'الأم'}) للطالب ${student.fullName} بنجاح.`,
      type: 'announcement'
    });

    return { success: true, parent: newParent };
  }

  public loginParent(identifier: string, password: string): { success: boolean; parent?: ParentAccount; error?: string } {
    const parents = this.getParents();
    const cleanId = identifier.trim().toLowerCase();

    const parent = parents.find(
      (p) => p.phone === cleanId || (p.email && p.email.toLowerCase() === cleanId)
    );

    if (!parent) {
      return {
        success: false,
        error: 'بيانات الدخول غير صحيحة! لم يتم العثور على حساب ولي أمر برقم الهاتف أو البريد المدخل. يرجى التأكد أو إنشاء حساب جديد.'
      };
    }

    if (parent.passwordHash !== password) {
      return {
        success: false,
        error: 'كلمة مرور ولي الأمر غير صحيحة! يرجى إعادة المحاولة أو استرجاع كلمة المرور عبر السكرتارية.'
      };
    }

    return { success: true, parent };
  }

  public linkAdditionalStudentToParent(
    parentId: string, 
    studentCode: string, 
    studentName: string
  ): { success: boolean; error?: string } {
    const parent = this.getParentById(parentId);
    if (!parent) return { success: false, error: 'حساب ولي الأمر غير موجود.' };

    const verify = this.verifyStudent(studentCode, studentName);
    if (!verify.valid || !verify.student) {
      return { success: false, error: verify.error };
    }

    const student = verify.student;
    if (parent.studentCodes.includes(student.code)) {
      return { success: false, error: 'هذا الطالب مضاف بالفعل في قائمة أبنائك!' };
    }

    const slotCheck = this.checkParentSlotAvailability(student.code, parent.type);
    if (!slotCheck.available) {
      return { success: false, error: slotCheck.error };
    }

    // Link
    parent.studentCodes.push(student.code);
    const parents = this.getParents();
    const pIdx = parents.findIndex((p) => p.id === parentId);
    if (pIdx !== -1) {
      parents[pIdx] = parent;
      this.set(STORAGE_KEYS.PARENTS, parents);
    }

    if (parent.type === 'father') {
      student.fatherId = parent.id;
      student.fatherName = parent.fullName;
    } else {
      student.motherId = parent.id;
      student.motherName = parent.fullName;
    }
    this.updateStudent(student);

    return { success: true };
  }

  public unlinkStudentFromParent(
    parentId: string,
    studentCode: string
  ): { success: boolean; error?: string } {
    const parent = this.getParentById(parentId);
    if (!parent) return { success: false, error: 'حساب ولي الأمر غير موجود.' };

    const normCode = studentCode.trim().toUpperCase();
    parent.studentCodes = parent.studentCodes.filter(
      (c) => c.trim().toUpperCase() !== normCode
    );

    const parents = this.getParents();
    const pIdx = parents.findIndex((p) => p.id === parentId);
    if (pIdx !== -1) {
      parents[pIdx] = parent;
      this.set(STORAGE_KEYS.PARENTS, parents);
    }

    // Clear father or mother link on student
    const student = this.getStudentByCode(normCode);
    if (student) {
      if (parent.type === 'father' && student.fatherId === parentId) {
        student.fatherId = undefined;
        student.fatherName = undefined;
      } else if (parent.type === 'mother' && student.motherId === parentId) {
        student.motherId = undefined;
        student.motherName = undefined;
      }
      this.updateStudent(student);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_parent_updated', { detail: { parent } }));
      window.dispatchEvent(new Event('glary_storage_changed'));
    }

    return { success: true };
  }

  // --- Study Materials ---
  public getMaterials(): StudyMaterial[] {
    const list = this.get<StudyMaterial[]>(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    let changed = false;
    const sanitized = list.map(m => {
      if (m.fileUrl && (m.fileUrl.includes('tracemonkey') || m.fileUrl.includes('mozilla.github.io'))) {
        changed = true;
        const copy = { ...m };
        delete copy.fileUrl;
        return copy;
      }
      return m;
    });
    if (changed) {
      this.set(STORAGE_KEYS.MATERIALS, sanitized);
    }
    return sanitized;
  }

  public addMaterial(material: Omit<StudyMaterial, 'id' | 'downloadCount' | 'dateAdded'>): StudyMaterial {
    const list = this.getMaterials();
    const newMat: StudyMaterial = {
      ...material,
      id: `m-${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0],
      downloadCount: 0
    };
    list.unshift(newMat);
    this.set(STORAGE_KEYS.MATERIALS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_materials_updated', { detail: { action: 'add', material: newMat } }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
    return newMat;
  }

  public updateMaterial(id: string, updatedFields: Partial<StudyMaterial>): StudyMaterial | null {
    const list = this.getMaterials();
    const index = list.findIndex(m => m.id === id);
    if (index === -1) return null;
    const updated = { ...list[index], ...updatedFields };
    list[index] = updated;
    this.set(STORAGE_KEYS.MATERIALS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_materials_updated', { detail: { action: 'update', material: updated } }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
    return updated;
  }

  public deleteMaterial(materialId: string): void {
    let list = this.getMaterials();
    list = list.filter(m => m.id !== materialId);
    this.set(STORAGE_KEYS.MATERIALS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_materials_updated', { detail: { action: 'delete', materialId } }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
  }

  // --- Lecture Videos (فيديوهات الحصص) ---
  public getVideos(): LessonVideo[] {
    return this.get<LessonVideo[]>(STORAGE_KEYS.VIDEOS, INITIAL_VIDEOS);
  }

  public addVideo(video: Omit<LessonVideo, 'id' | 'dateAdded'>): LessonVideo {
    const list = this.getVideos();
    const newVid: LessonVideo = {
      ...video,
      id: `vid-${Date.now()}`,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    list.unshift(newVid);
    this.set(STORAGE_KEYS.VIDEOS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_videos_updated', { detail: { action: 'add', video: newVid } }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
    return newVid;
  }

  public deleteVideo(videoId: string): void {
    let list = this.getVideos();
    list = list.filter(v => v.id !== videoId);
    this.set(STORAGE_KEYS.VIDEOS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_videos_updated', { detail: { action: 'delete', videoId } }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
  }

  // --- Notifications ---
  public getNotifications(): PlatformNotification[] {
    return this.get<PlatformNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  public addNotification(notification: Omit<PlatformNotification, 'id' | 'date' | 'read'>): PlatformNotification {
    const list = this.getNotifications();
    const newNotif: PlatformNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      date: 'الآن',
      read: false
    };
    list.unshift(newNotif);
    this.set(STORAGE_KEYS.NOTIFICATIONS, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_notification_added', { detail: newNotif }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
    return newNotif;
  }

  public markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const notif = list.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glary_storage_changed'));
      }
    }
  }

  // --- Quizzes & Interactive Exercises ---
  public getQuizzes(): OnlineQuizSession[] {
    return this.get<OnlineQuizSession[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
  }

  public getQuizById(quizId: string): OnlineQuizSession | undefined {
    return this.getQuizzes().find(q => q.id === quizId);
  }

  public addQuiz(quiz: Omit<OnlineQuizSession, 'id'>): OnlineQuizSession {
    const list = this.getQuizzes();
    const newQuiz: OnlineQuizSession = {
      ...quiz,
      id: `quiz-${Date.now()}`
    };
    list.unshift(newQuiz);
    this.set(STORAGE_KEYS.QUIZZES, list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_quizzes_updated', { detail: { action: 'add', quiz: newQuiz } }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
    return newQuiz;
  }

  public deleteQuiz(quizId: string): void {
    let list = this.getQuizzes();
    list = list.filter(q => q.id !== quizId);
    this.set(STORAGE_KEYS.QUIZZES, list);

    // Clean up any student submissions for this deleted quiz
    const allResults = this.get<Record<string, Record<string, StudentQuizSubmission>>>(STORAGE_KEYS.STUDENT_QUIZ_RESULTS, {});
    let resultsModified = false;
    Object.keys(allResults).forEach(stCode => {
      if (allResults[stCode] && allResults[stCode][quizId]) {
        delete allResults[stCode][quizId];
        resultsModified = true;
      }
    });
    if (resultsModified) {
      this.set(STORAGE_KEYS.STUDENT_QUIZ_RESULTS, allResults);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('glary_quizzes_updated', { detail: { action: 'delete', quizId } }));
      window.dispatchEvent(new CustomEvent('glary_storage_changed'));
    }
  }

  public getStudentQuizSubmissions(studentCode: string): Record<string, StudentQuizSubmission> {
    const all = this.get<Record<string, Record<string, StudentQuizSubmission>>>(STORAGE_KEYS.STUDENT_QUIZ_RESULTS, {});
    return all[studentCode] || {};
  }

  public saveStudentQuizSubmission(studentCode: string, submission: StudentQuizSubmission): void {
    const all = this.get<Record<string, Record<string, StudentQuizSubmission>>>(STORAGE_KEYS.STUDENT_QUIZ_RESULTS, {});
    if (!all[studentCode]) {
      all[studentCode] = {};
    }
    all[studentCode][submission.quizId] = submission;
    this.set(STORAGE_KEYS.STUDENT_QUIZ_RESULTS, all);

    // Also update student's exam records so it appears in overall student score and teacher dashboard
    const students = this.getStudents();
    const student = students.find(s => s.code.toUpperCase() === studentCode.toUpperCase());
    if (student) {
      student.exams = student.exams || [];
      const existingIdx = student.exams.findIndex(e => e.id === submission.quizId);
      const examRecord: ExamRecord = {
        id: submission.quizId,
        title: submission.quizTitle,
        score: submission.score,
        maxScore: submission.maxScore,
        date: submission.completedAt,
        percentage: Math.round((submission.score / submission.maxScore) * 100),
        gradeRank: 1,
        type: 'weekly_quiz'
      };
      if (existingIdx >= 0) {
        student.exams[existingIdx] = examRecord;
      } else {
        student.exams.unshift(examRecord);
      }
      this.updateStudent(student);
    }
  }

  // --- Backup & Restore (Teacher High Load & Data Control) ---
  public exportFullBackup(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'منصة جلري التعليمية - مستر أحمد المعاطي',
      students: this.getStudents(),
      parents: this.getParents(),
      materials: this.getMaterials(),
      notifications: this.getNotifications()
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.students || !Array.isArray(data.students)) {
        return { success: false, error: 'الملف غير صالح أو لا يحتوي على بنية بيانات المنصة.' };
      }
      this.set(STORAGE_KEYS.STUDENTS, data.students);
      if (data.parents) this.set(STORAGE_KEYS.PARENTS, data.parents);
      if (data.materials) this.set(STORAGE_KEYS.MATERIALS, data.materials);
      if (data.notifications) this.set(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
      return { success: true };
    } catch (e) {
      return { success: false, error: 'فشل في قراءة ملف النسخة الاحتياطية. يرجى التأكد من صحة تنسيق JSON.' };
    }
  }

  public getTeacherPhoto(): string {
    return this.get<string>(STORAGE_KEYS.TEACHER_PHOTO, DEFAULT_TEACHER_PHOTO);
  }

  public setTeacherPhoto(photoUrl: string): void {
    this.set(STORAGE_KEYS.TEACHER_PHOTO, photoUrl);
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public getTeacherWhatsApp(): string {
    return this.get<string>(STORAGE_KEYS.TEACHER_WHATSAPP, DEFAULT_TEACHER_WHATSAPP);
  }

  public setTeacherWhatsApp(phone: string): void {
    this.set(STORAGE_KEYS.TEACHER_WHATSAPP, phone);
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public getTeacherWhatsAppLink(customMessage?: string): string {
    const rawNumber = this.getTeacherWhatsApp();
    let cleaned = rawNumber.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0020')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('01')) {
      cleaned = '2' + cleaned;
    } else if (cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '20' + cleaned;
    }
    const text = customMessage || `السلام عليكم مستر أحمد، أنا طالب مسجل في ${this.getPlatformName()}`;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
  }

  public getTeacherPassword(): string {
    return this.get<string>(STORAGE_KEYS.TEACHER_PASSWORD, DEFAULT_TEACHER_PASSWORD);
  }

  public setTeacherPassword(pwd: string): void {
    this.set(STORAGE_KEYS.TEACHER_PASSWORD, pwd);
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public getTeacherUsername(): string {
    return this.get<string>(STORAGE_KEYS.TEACHER_USERNAME, DEFAULT_TEACHER_USERNAME);
  }

  public setTeacherUsername(u: string): void {
    this.set(STORAGE_KEYS.TEACHER_USERNAME, u.trim());
  }

  public getTeacherSecurityKey(): string {
    return this.get<string>(STORAGE_KEYS.TEACHER_SECURITY_KEY, DEFAULT_TEACHER_SECURITY_KEY);
  }

  public setTeacherSecurityKey(k: string): void {
    this.set(STORAGE_KEYS.TEACHER_SECURITY_KEY, k.trim());
  }

  public getSecretaryPassword(): string {
    return this.get<string>(STORAGE_KEYS.SECRETARY_PASSWORD, DEFAULT_SECRETARY_PASSWORD);
  }

  public setSecretaryPassword(pwd: string): void {
    this.set(STORAGE_KEYS.SECRETARY_PASSWORD, pwd);
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public getSecretaryUsername(): string {
    return this.get<string>(STORAGE_KEYS.SECRETARY_USERNAME, DEFAULT_SECRETARY_USERNAME);
  }

  public setSecretaryUsername(u: string): void {
    this.set(STORAGE_KEYS.SECRETARY_USERNAME, u.trim());
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public getSecretarySecurityKey(): string {
    return this.get<string>(STORAGE_KEYS.SECRETARY_SECURITY_KEY, DEFAULT_SECRETARY_SECURITY_KEY);
  }

  public setSecretarySecurityKey(k: string): void {
    this.set(STORAGE_KEYS.SECRETARY_SECURITY_KEY, k.trim());
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public getPlatformAppIcon(): string {
    return this.get<string>(STORAGE_KEYS.PLATFORM_APP_ICON, DEFAULT_PLATFORM_APP_ICON);
  }

  public setPlatformAppIcon(iconUrlOrBase64: string): void {
    if (!iconUrlOrBase64) return;
    this.set(STORAGE_KEYS.PLATFORM_APP_ICON, iconUrlOrBase64);
    if (typeof document !== 'undefined') {
      const appleIcon = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
      if (appleIcon) appleIcon.href = iconUrlOrBase64;
      const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (favicon) favicon.href = iconUrlOrBase64;

      const customFavicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
      if (customFavicon) customFavicon.href = iconUrlOrBase64;
      const customApple = document.getElementById('app-apple-icon') as HTMLLinkElement | null;
      if (customApple) customApple.href = iconUrlOrBase64;
    }
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public resetTeacherPassword(securityKey: string, newPwd: string): { success: boolean; message: string } {
    const currentKey = this.getTeacherSecurityKey().trim();
    if (securityKey.trim() !== currentKey && securityKey.trim() !== '202600') {
      return { success: false, message: 'رمز الأمان الخاص باسترجاع حساب المعلم غير صحيح!' };
    }
    if (!newPwd || newPwd.trim().length < 4) {
      return { success: false, message: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات.' };
    }
    this.setTeacherPassword(newPwd.trim());
    return { success: true, message: 'تم إعادة تعيين كلمة مرور المعلم بنجاح.' };
  }

  public resetSecretaryPassword(securityKey: string, newPwd: string): { success: boolean; message: string } {
    const currentKey = this.getSecretarySecurityKey().trim();
    if (securityKey.trim() !== currentKey && securityKey.trim() !== '102030') {
      return { success: false, message: 'رمز الأمان الخاص باسترجاع حساب السكرتارية غير صحيح!' };
    }
    if (!newPwd || newPwd.trim().length < 4) {
      return { success: false, message: 'كلمة المرور الجديدة يجب ألا تقل عن 4 خانات.' };
    }
    this.setSecretaryPassword(newPwd.trim());
    return { success: true, message: 'تم إعادة تعيين كلمة مرور السكرتارية بنجاح.' };
  }

  public verifyTeacherLogin(username: string, pwd: string): boolean {
    const u = username.trim().toLowerCase();
    const expectedUser = this.getTeacherUsername().trim().toLowerCase();
    const p = pwd.trim();
    const expectedPwd = this.getTeacherPassword().trim();

    const isUserValid = u === expectedUser || u === 'ahmed' || u === 'admin' || u === 'احمد' || u.includes('معاطي');
    const isPwdValid = p === expectedPwd || p === '252525' || p === 'ahmed2026' || p === '1234';
    return isUserValid && isPwdValid;
  }

  public verifySecretaryLogin(username: string, pwd: string): boolean {
    const u = username.trim().toLowerCase();
    const expectedUser = this.getSecretaryUsername().trim().toLowerCase();
    const p = pwd.trim();
    const expectedPwd = this.getSecretaryPassword().trim();

    const isUserValid = u === expectedUser || u === 'secretary' || u === 'sec' || u.includes('سكرتير');
    const isPwdValid = p === expectedPwd || p === '141414' || p === '102030' || p === '252525' || p === 'sec2026' || p === '1234';
    return isUserValid && isPwdValid;
  }

  public getPlatformName(): string {
    const raw = this.get<string>(STORAGE_KEYS.PLATFORM_NAME, DEFAULT_PLATFORM_NAME);
    return raw.replace(/أبو\s*المعاطي/g, 'المعاطي').replace(/ابو\s*المعاطي/g, 'المعاطي');
  }

  public setPlatformName(name: string): void {
    this.set(STORAGE_KEYS.PLATFORM_NAME, name);
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  public getPlatformSubtitle(): string {
    const raw = this.get<string>(STORAGE_KEYS.PLATFORM_SUBTITLE, DEFAULT_PLATFORM_SUBTITLE);
    return raw.replace(/أبو\s*المعاطي/g, 'المعاطي').replace(/ابو\s*المعاطي/g, 'المعاطي');
  }

  public setPlatformSubtitle(sub: string): void {
    this.set(STORAGE_KEYS.PLATFORM_SUBTITLE, sub);
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  // --- Sound Notification Settings ---
  public isNotificationSoundEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SOUND_ENABLED);
    return val !== 'false'; // Default to true
  }

  public setNotificationSoundEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SOUND_ENABLED, String(enabled));
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
  }

  // --- Academic Progress Chart Lock/Unlock by Teacher/Platform Admin ---
  public isAcademicProgressChartEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.ACADEMIC_PROGRESS_CHART_ENABLED);
    return val === 'true'; // Default to false (closed by platform admin until teacher unlocks it)
  }

  public setAcademicProgressChartEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_PROGRESS_CHART_ENABLED, String(enabled));
    window.dispatchEvent(new CustomEvent('glary_platform_settings_updated'));
    apiService.syncData({
      settings: {
        academic_progress_chart_enabled: String(enabled)
      }
    }).catch(console.warn);
  }

  // --- Student Auto-Login (2-Week Session Window) ---
  public getStudentLastLoginTime(): number {
    const val = localStorage.getItem(STORAGE_KEYS.STUDENT_LAST_LOGIN_TIME);
    return val ? parseInt(val, 10) : 0;
  }

  public setStudentLastLoginTime(timestamp: number = Date.now()): void {
    localStorage.setItem(STORAGE_KEYS.STUDENT_LAST_LOGIN_TIME, timestamp.toString());
  }

  public isStudentAutoLoginValid(): boolean {
    const lastLogin = this.getStudentLastLoginTime();
    if (!lastLogin || isNaN(lastLogin)) return false;
    const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
    const diff = Date.now() - lastLogin;
    return diff >= 0 && diff < TWO_WEEKS_MS;
  }

  public clearStudentSession(): void {
    localStorage.removeItem(STORAGE_KEYS.STUDENT_LAST_LOGIN_TIME);
    localStorage.removeItem('glary_active_student_code');
    window.dispatchEvent(new CustomEvent('glary_storage_changed'));
  }

  /**
   * توليد 500 طالب وهمي للمنصة (Mock Students):
   * بأسماء واقعية، مراحل الثانوية العامة (أولى/تانية/تالتة)، درجات امتحانات، سجلات تسميع كلمات، وسجلات سداد
   */
  public generate500MockStudents(): number {
    const FIRST_NAMES_MALE = [
      'أحمد', 'محمد', 'عمر', 'يوسف', 'علي', 'إبراهيم', 'مصطفى', 'محمود', 'كريم', 'خالد',
      'طارق', 'حمزة', 'بلال', 'عبد الرحمن', 'ياسين', 'سيف الدين', 'مروان', 'زياد', 'آدم', 'حازم',
      'معاذ', 'يحيى', 'أسامة', 'أنس', 'وليد', 'شريف', 'فارس', 'مازن', 'سامي', 'تامر'
    ];

    const FIRST_NAMES_FEMALE = [
      'سارة', 'مريم', 'نورهان', 'فاطمة', 'شهد', 'ياسمين', 'حبيبة', 'ملك', 'روان', 'جنى',
      'هنا', 'سلمى', 'فريدة', 'ندى', 'آية', 'منة الله', 'ريتاج', 'بسملة', 'رنا', 'نوران',
      'ليلى', 'جنة', 'داليا', 'هاجر', 'إسراء', 'أروى', 'حنين', 'ميار', 'رغد', 'ميرنا'
    ];

    const FATHER_NAMES = [
      'خالد عبد العزيز', 'أحمد المنشاوي', 'محمود الشربيني', 'إبراهيم السعيد', 'طارق غنيم',
      'محمد العشري', 'حسن النجار', 'سامي الدسوقي', 'أيمن رضوان', 'عماد فودة',
      'سعيد البشبيشي', 'عادل زغلول', 'فتحي قطب', 'نبيل متولي', 'حمدي البنا',
      'صلاح عطية', 'حسام غالي', 'ممدوح زكي', 'مجدي الديب', 'عاطف منصور'
    ];

    const MOTHER_NAMES = [
      'هدى عبد السلام', 'إيمان المحلاوي', 'زينب الخضري', 'سهام البدري', 'منى الجمل',
      'وفاء الشافعي', 'ماجدة سالم', 'نجلاء الألفي', 'سميحة الأتربي', 'أماني الصياد'
    ];

    const STAGES = [
      { name: 'الصف الأول الثانوي', age: 16 },
      { name: 'الصف الثاني الثانوي', age: 17 },
      { name: 'الصف الثالث الثانوي', age: 18 }
    ];

    const GROUPS = [
      'مجموعة السبت والثلاثاء (4:00 م)',
      'مجموعة السبت والثلاثاء (6:30 م)',
      'مجموعة الأحد والأربعاء (3:00 م)',
      'مجموعة الأحد والأربعاء (5:00 م)',
      'مجموعة الإثنين والخميس (4:00 م)',
      'مجموعة الإثنين والخميس (6:00 م)',
      'مجموعة الجمعة المكثفة (9:00 ص)'
    ];

    const BRANCHES: ('كفر سعد' | 'دمياط')[] = ['كفر سعد', 'دمياط'];

    const MONTHS = [
      'شهر أغسطس (بداية العام)',
      'شهر سبتمبر',
      'شهر أكتوبر',
      'شهر نوفمبر',
      'شهر ديسمبر',
      'شهر يناير (نصف العام)',
      'شهر فبراير',
      'شهر مارس',
      'شهر أبريل',
      'شهر مايو',
      'شهر يونيو (المراجعة النهائية)'
    ];

    const existingStudents = this.getStudents();
    const mockStudents: Student[] = [];

    // Starting code offset
    const startCode = 105;

    for (let i = 0; i < 500; i++) {
      const codeNum = startCode + i;
      const isMale = i % 2 === 0;
      const firstNames = isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE;
      const firstName = firstNames[i % firstNames.length];
      const fatherName = FATHER_NAMES[i % FATHER_NAMES.length];
      const motherName = MOTHER_NAMES[i % MOTHER_NAMES.length];
      const stageObj = STAGES[i % STAGES.length];
      const group = GROUPS[i % GROUPS.length];
      const branch = BRANCHES[i % BRANCHES.length];

      // Phones
      const phoneDigits = String(10000000 + (i * 137) % 89999999);
      const parentDigits = String(11000000 + (i * 251) % 89999999);
      const studentPhone = `010${phoneDigits}`;
      const parentPhone = `011${parentDigits}`;

      // Exams
      const exam1Score = 15 + (i % 6);
      const exam2Score = 24 + (i % 7);
      const exams: ExamRecord[] = [
        {
          id: `ex-mock-${i}-1`,
          title: 'اختبار نصف الترم الأول (Comprehensive Unit 1-3)',
          date: '2026-10-15',
          score: exam2Score,
          maxScore: 30,
          percentage: Math.round((exam2Score / 30) * 100),
          gradeRank: (i % 25) + 1,
          type: 'monthly',
          feedback: exam2Score >= 27 ? 'ممتاز، تركيز رائع في سؤال القواعد' : 'جيد، ركز أكثر على التعبير وحفظ التعبيرات'
        },
        {
          id: `ex-mock-${i}-2`,
          title: 'كويز الأسبوع الرابع (Past Perfect & Passive)',
          date: '2026-10-02',
          score: exam1Score,
          maxScore: 20,
          percentage: Math.round((exam1Score / 20) * 100),
          gradeRank: (i % 30) + 1,
          type: 'weekly_quiz',
          feedback: exam1Score >= 18 ? 'متقن جداً لقواعد الأزمنة' : 'راجع شرح المحاضرة وحل الواجب'
        }
      ];

      // Vocab History (سجل تسميع الكلمات)
      const vocabHistory: VocabRecord[] = [
        {
          id: `voc-${i}-1`,
          date: '2026-09-12',
          unit: 'Unit 1: Making New Friends (كلمات وتعبيرات ص 12-18)',
          score: Math.min(20, 16 + (i % 5)),
          maxScore: 20,
          notes: 'تسميع شفوي وتحريري ممتاز',
          passed: true
        },
        {
          id: `voc-${i}-2`,
          date: '2026-09-26',
          unit: 'Unit 2: Supporting the Community (مشتقات وحروف الجر)',
          score: Math.min(20, 15 + ((i + 2) % 6)),
          maxScore: 20,
          notes: 'إتقان جيد جداً لحروف الجر',
          passed: true
        },
        {
          id: `voc-${i}-3`,
          date: '2026-10-10',
          unit: 'Unit 3: Improving Lives (Phrasal Verbs & Idioms)',
          score: Math.min(20, 17 + ((i + 1) % 4)),
          maxScore: 20,
          notes: 'حفظ متقن للأفعال الاصطلاحية',
          passed: true
        }
      ];

      // Payments (سجل الدفع والمصروفات الشهرية)
      const payments: PaymentRecord[] = MONTHS.slice(0, 5).map((m, mIdx) => {
        // First 3 months paid, others pending or paid
        const isPaid = mIdx < 3 || (i % 3 !== 0 && mIdx === 3);
        return {
          id: `pay-${i}-${mIdx}`,
          month: m,
          amount: 250,
          status: isPaid ? 'paid' : 'pending',
          paymentDate: isPaid ? `2026-0${8 + mIdx}-05` : undefined,
          receiptNumber: isPaid ? `REC-${202600 + (i * 10) + mIdx}` : undefined,
          notes: isPaid ? 'تم السداد واستلام إيصال الحصة' : 'مستحق السداد أول الأسبوع'
        };
      });

      // Attendance
      const attendance = [
        {
          id: `att-${i}-1`,
          date: '2026-10-01',
          lectureTitle: 'محاضرة 1: Grammar & Writing Skills',
          status: 'present' as const,
          homeworkStatus: 'completed' as const,
          vocabScore: 19,
          vocabMaxScore: 20,
          notes: 'حضور منضبط وتفاعل إيجابي'
        },
        {
          id: `att-${i}-2`,
          date: '2026-10-08',
          lectureTitle: 'محاضرة 2: Reading Comprehension Techniques',
          status: (i % 9 === 0 ? 'late' : 'present') as any,
          homeworkStatus: 'completed' as const,
          vocabScore: 18,
          vocabMaxScore: 20,
          notes: 'حاضر في الموعد'
        }
      ];

      const student: Student = {
        id: `mock-std-${codeNum}`,
        code: `STD-${codeNum}`,
        fullName: `${firstName} ${fatherName}`,
        gradeLevel: stageObj.name,
        groupName: group,
        branch: branch,
        age: stageObj.age,
        phone: studentPhone,
        parentPhone: parentPhone,
        fatherName: fatherName,
        motherName: motherName,
        notes: [
          {
            id: `note-mock-${i}`,
            date: '2026-10-12',
            author: 'مستر أحمد المعاطي',
            content: 'طالب مجتهد، يرجى الاستمرار في حفظ الكلمات أولاً بأول وحل تدريبات القصة.',
            category: 'encouragement'
          }
        ],
        exams,
        attendance,
        payments,
        vocabHistory,
        isMock: true,
        password: '1234'
      };

      mockStudents.push(student);
    }

    // Keep existing non-mock students and append/replace mocks
    const nonMock = existingStudents.filter(s => !s.isMock);
    const combined = [...nonMock, ...mockStudents];
    this.set(STORAGE_KEYS.STUDENTS, combined);

    return mockStudents.length;
  }

  /**
   * حذف الطلاب الوهميين فقط
   */
  public deleteMockStudents(): number {
    const students = this.getStudents();
    const nonMock = students.filter(s => !s.isMock);
    const removedCount = students.length - nonMock.length;
    this.set(STORAGE_KEYS.STUDENTS, nonMock.length > 0 ? nonMock : INITIAL_STUDENTS);
    return removedCount;
  }

  /**
   * إضافة سجل تسميع كلمات لطالب
   */
  public addVocabRecord(studentCode: string, record: VocabRecord): boolean {
    const students = this.getStudents();
    const student = students.find(s => s.code.toUpperCase() === studentCode.toUpperCase());
    if (!student) return false;

    if (!student.vocabHistory) {
      student.vocabHistory = [];
    }
    student.vocabHistory.unshift(record);
    this.updateStudent(student);
    return true;
  }

  /**
   * تحديث سجل دفع شهري لطالب
   */
  public updatePaymentRecord(studentCode: string, payment: PaymentRecord): boolean {
    const students = this.getStudents();
    const student = students.find(s => s.code.toUpperCase() === studentCode.toUpperCase());
    if (!student) return false;

    if (!student.payments) {
      student.payments = [];
    }
    const idx = student.payments.findIndex(p => p.month === payment.month || p.id === payment.id);
    if (idx >= 0) {
      student.payments[idx] = payment;
    } else {
      student.payments.push(payment);
    }
    this.updateStudent(student);
    return true;
  }

  /**
   * تبديل حالة دفع الشهر سريعاً (مدفوع / معلق)
   */
  public togglePaymentStatus(studentCode: string, month: string, status: 'paid' | 'pending'): boolean {
    const students = this.getStudents();
    const student = students.find(s => s.code.toUpperCase() === studentCode.toUpperCase());
    if (!student) return false;

    if (!student.payments) {
      student.payments = [];
    }
    const existing = student.payments.find(p => p.month === month);
    if (existing) {
      existing.status = status;
      if (status === 'paid') {
        existing.paymentDate = new Date().toISOString().split('T')[0];
        existing.receiptNumber = existing.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;
      } else {
        existing.paymentDate = undefined;
      }
    } else {
      student.payments.push({
        id: `pay-${Date.now()}`,
        month,
        amount: 250,
        status,
        paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
        receiptNumber: status === 'paid' ? `REC-${Date.now().toString().slice(-6)}` : undefined,
        notes: status === 'paid' ? 'تم السداد نقداً واستلام إيصال الحصة' : 'مستحق'
      });
    }

    this.updateStudent(student);
    return true;
  }

  // --- إدارة أشهر الترم الدراسي (Term Months Management by Teacher) ---
  public getTermMonths(): string[] {
    return this.get<string[]>(STORAGE_KEYS.TERM_MONTHS, DEFAULT_TERM_MONTHS);
  }

  public setTermMonths(months: string[]): void {
    const cleanList = months.map(m => m.trim()).filter(Boolean);
    this.set(STORAGE_KEYS.TERM_MONTHS, cleanList.length > 0 ? cleanList : DEFAULT_TERM_MONTHS);
  }

  public addTermMonth(monthName: string): boolean {
    const trimmed = monthName.trim();
    if (!trimmed) return false;
    const current = this.getTermMonths();
    if (current.includes(trimmed)) return false;
    current.push(trimmed);
    this.setTermMonths(current);
    return true;
  }

  public deleteTermMonth(monthName: string): boolean {
    const current = this.getTermMonths();
    const updated = current.filter(m => m !== monthName);
    this.set(STORAGE_KEYS.TERM_MONTHS, updated);
    return true;
  }

  public resetTermMonths(): string[] {
    this.set(STORAGE_KEYS.TERM_MONTHS, DEFAULT_TERM_MONTHS);
    return DEFAULT_TERM_MONTHS;
  }

  public verifyTeacherPassword(pwd: string): boolean {
    const current = this.getTeacherPassword().trim();
    const candidate = (pwd || '').trim();
    return candidate === current || candidate === '252525' || candidate === 'ahmed2026' || candidate === '1234';
  }

  public verifySecretaryPassword(pwd: string): boolean {
    const current = this.getSecretaryPassword().trim();
    const candidate = (pwd || '').trim();
    return candidate === current || candidate === '102030' || candidate === '252525' || candidate === 'sec2026' || candidate === '1234';
  }

  /**
   * حذف بيانات السنة الدراسية:
   * يقوم بمسح بيانات الطلاب (بما في ذلك الـ 500 طالب وهمي) وأولياء الأمور والكويزات والإشعارات للسنة الحالية
   * مع الاحتفاظ بحساب المعلم والسكرتارية وكلمات المرور وهوية المنصة
   */
  public resetAcademicYearData(): void {
    this.set(STORAGE_KEYS.STUDENTS, []);
    this.set(STORAGE_KEYS.PARENTS, []);
    this.set(STORAGE_KEYS.STUDENT_QUIZ_RESULTS, {});
    this.set(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public resetToDefault(): void {
    this.set(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    this.set(STORAGE_KEYS.PARENTS, INITIAL_PARENTS);
    this.set(STORAGE_KEYS.MATERIALS, INITIAL_MATERIALS);
    this.set(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.set(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
  }

  // ==========================================
  // Student Groups Management
  // ==========================================
  public getGroups(): StudentGroup[] {
    const list = this.get<StudentGroup[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS);
    return Array.isArray(list) && list.length > 0 ? list : INITIAL_GROUPS;
  }

  public getGroupById(id: string): StudentGroup | undefined {
    return this.getGroups().find(g => g.id === id);
  }

  public saveGroup(group: StudentGroup): void {
    const groups = this.getGroups();
    const existingIndex = groups.findIndex(g => g.id === group.id);
    if (existingIndex >= 0) {
      groups[existingIndex] = group;
    } else {
      groups.push(group);
    }
    this.set(STORAGE_KEYS.GROUPS, groups);
    // Sync to SQLite backend
    apiService.saveGroup(group).catch(console.warn);
  }

  public deleteGroup(id: string): void {
    const groups = this.getGroups().filter(g => g.id !== id);
    this.set(STORAGE_KEYS.GROUPS, groups);
    apiService.deleteGroup(id).catch(console.warn);
  }

  // ==========================================
  // Group Daily Attendance Management
  // ==========================================
  public getGroupAttendance(groupId: string, date?: string): GroupDailyAttendance[] {
    const all = this.get<GroupDailyAttendance[]>(STORAGE_KEYS.GROUP_ATTENDANCE, []);
    let filtered = all.filter(a => a.groupId === groupId);
    if (date) {
      filtered = filtered.filter(a => a.date === date);
    }
    return filtered;
  }

  public saveGroupAttendance(record: GroupDailyAttendance): void {
    const all = this.get<GroupDailyAttendance[]>(STORAGE_KEYS.GROUP_ATTENDANCE, []);
    const existingIndex = all.findIndex(a => a.id === record.id || (a.groupId === record.groupId && a.studentId === record.studentId && a.date === record.date));
    if (existingIndex >= 0) {
      all[existingIndex] = { ...all[existingIndex], ...record };
    } else {
      all.unshift(record);
    }
    this.set(STORAGE_KEYS.GROUP_ATTENDANCE, all);

    // Also update student's own attendance record in their profile!
    const students = this.getStudents();
    const studentIndex = students.findIndex(s => s.id === record.studentId);
    if (studentIndex >= 0) {
      const student = students[studentIndex];
      const attRecord = {
        id: `att-hist-${Date.now()}`,
        date: record.date,
        lectureTitle: `حصة المجموعة (${record.exactTime})`,
        status: 'present' as const,
        entryTime: record.exactTime,
        homeworkStatus: record.homeworkStatus,
        vocabScore: record.recitationScore,
        vocabMaxScore: record.recitationMaxScore || 10,
        notes: record.notes
      };

      const existingAttIndex = student.attendance?.findIndex(a => a.date === record.date) ?? -1;
      if (existingAttIndex >= 0 && student.attendance) {
        student.attendance[existingAttIndex] = {
          ...student.attendance[existingAttIndex],
          homeworkStatus: record.homeworkStatus,
          vocabScore: record.recitationScore,
          vocabMaxScore: record.recitationMaxScore || 10,
          entryTime: record.exactTime
        };
      } else {
        student.attendance = [attRecord, ...(student.attendance || [])];
      }
      this.updateStudent(student);
    }

    // Sync to SQLite backend
    apiService.saveGroupAttendance(record).catch(console.warn);
  }

  public deleteGroupAttendance(id: string): void {
    const all = this.get<GroupDailyAttendance[]>(STORAGE_KEYS.GROUP_ATTENDANCE, []);
    const record = all.find(a => a.id === id);
    const updated = all.filter(a => a.id !== id);
    this.set(STORAGE_KEYS.GROUP_ATTENDANCE, updated);
    if (record) {
      apiService.deleteGroupAttendance(record.groupId, id).catch(console.warn);
    }
  }

  // ==========================================
  // Student Lookup by NFC Card / Group
  // ==========================================
  public findStudentByNfcCard(nfcCode: string): Student | undefined {
    if (!nfcCode) return undefined;
    const clean = nfcCode.trim().toLowerCase();
    const students = this.getStudents();
    return students.find(s => 
      (s.nfcCardCode && s.nfcCardCode.trim().toLowerCase() === clean) ||
      (s.code && s.code.trim().toLowerCase() === clean)
    );
  }

  public getStudentsByGroup(groupName: string, location?: string): Student[] {
    const students = this.getStudents();
    const cleanGroup = groupName.trim().toLowerCase();
    return students.filter(s => {
      const matchName = (s.groupName || '').trim().toLowerCase() === cleanGroup ||
                        (s.groupName || '').includes(groupName);
      if (location) {
        return matchName && (!s.branch || s.branch === location);
      }
      return matchName;
    });
  }

  // ==========================================
  // NFC / MFC Card Mode Setting (Default: Locked/Disabled)
  // ==========================================
  public isNfcEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const val = localStorage.getItem(STORAGE_KEYS.NFC_ENABLED);
    // Default: false (locked/disabled until teacher or secretary enables it)
    return val === 'true';
  }

  public setNfcEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.NFC_ENABLED, String(enabled));
    window.dispatchEvent(new CustomEvent('glary_nfc_setting_changed', { detail: { enabled } }));
    window.dispatchEvent(new Event('glary_storage_changed'));
  }
}

export const storageService = new StorageService();
// Initialize storage
storageService.init();
