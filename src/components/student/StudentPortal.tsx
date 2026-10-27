import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Calendar, 
  Sparkles, 
  Trophy, 
  ArrowRight, 
  Lock, 
  KeyRound, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Video,
  FileText,
  MessageCircle,
  ShieldCheck,
  Play,
  ChevronRight,
  ChevronLeft,
  Download,
  CheckCircle2,
  Filter,
  Layers,
  Medal,
  Star,
  Clock
} from 'lucide-react';
import { Student, StudyMaterial, LessonVideo } from '../../types';
import { storageService, isGradeMatch } from '../../services/storage';
import { VideoLecturesTab } from './VideoLecturesTab';
import { StudentProgressCharts } from '../common/StudentProgressCharts';
import { AttendanceCalendar } from '../common/AttendanceCalendar';
import { TrendingUp } from 'lucide-react';
import { PortalRole } from '../../services/portalLinks';
import { MaterialPreviewModal } from '../materials/MaterialPreviewModal';

interface Props {
  onBackToRoles: () => void;
  onSendNotificationToast: (title: string, body: string) => void;
  onOpenPWAInstall?: (targetRole?: PortalRole) => void;
  onSwitchToStaffPortal?: (role: 'teacher' | 'secretary') => void;
  onStudentLogin?: (student: Student) => void;
  onStudentLogout?: () => void;
}

// Helper to get Arabic day name from date string (YYYY-MM-DD)
const getArabicDayName = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        return days[date.getDay()];
      }
    }
  } catch {
    // fallback
  }
  return '';
};

export const StudentPortal: React.FC<Props> = ({ 
  onBackToRoles, 
  onSendNotificationToast, 
  onOpenPWAInstall,
  onSwitchToStaffPortal,
  onStudentLogin,
  onStudentLogout,
}) => {
  // Input fields for student login / registration
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Remembered student info on this device
  const [rememberedCode, setRememberedCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('glary_remembered_student_code');
  });
  const [rememberedName, setRememberedName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('glary_remembered_student_name');
  });
  const [isQuickUnlockMode, setIsQuickUnlockMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('glary_remembered_student_code'));
  });

  const [activeStudent, setActiveStudent] = useState<Student | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedCode = localStorage.getItem('glary_active_student_code') || localStorage.getItem('glary_remembered_student_code');
    // If student was logged in and session is within 2 weeks: auto-login immediately!
    if (savedCode && storageService.isStudentAutoLoginValid()) {
      const st = storageService.getStudentByCode(savedCode);
      if (st) {
        localStorage.setItem('glary_active_student_code', st.code);
        return st;
      }
    }
    // If 2 weeks passed or not logged in, ensure active session requires password again
    localStorage.removeItem('glary_active_student_code');
    return null;
  });
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'leaderboard' | 'analytics' | 'calendar' | 'videos' | 'materials'>('overview');
  const [examFilter, setExamFilter] = useState<'all' | 'comprehensive' | 'monthly' | 'quiz'>('all');

  // Academic Progress Chart lock status (managed by Teacher / Secretary)
  const [isChartUnlocked, setIsChartUnlocked] = useState<boolean>(() => storageService.isAcademicProgressChartEnabled());
  const [teacherWhatsApp, setTeacherWhatsApp] = useState<string>(() => storageService.getTeacherWhatsApp());

  // Navigation tab bar ref for horizontal scrolling
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Material Document Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);

  const [allStudents, setAllStudents] = useState<Student[]>(() => storageService.getStudents());
  const [allVideos, setAllVideos] = useState<LessonVideo[]>(() => storageService.getVideos());
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => storageService.getMaterials());

  // Keep activeStudent, videos, materials fresh from storage so deletions/additions by teacher reflect immediately
  useEffect(() => {
    const refreshData = () => {
      if (activeStudent) {
        const fresh = storageService.getStudentById(activeStudent.id) || storageService.getStudentByCode(activeStudent.code);
        if (fresh) {
          setActiveStudent({ ...fresh });
        }
      }
      setAllStudents(storageService.getStudents());
      setAllVideos(storageService.getVideos());
      setMaterials(storageService.getMaterials());
      setIsChartUnlocked(storageService.isAcademicProgressChartEnabled());
      setTeacherWhatsApp(storageService.getTeacherWhatsApp());
    };

    window.addEventListener('glary_homework_assigned', refreshData);
    window.addEventListener('glary_videos_updated', refreshData);
    window.addEventListener('glary_materials_updated', refreshData);
    window.addEventListener('glary_platform_settings_updated', refreshData);
    window.addEventListener('glary_storage_changed', refreshData);
    window.addEventListener('storage', refreshData);
    window.addEventListener('focus', refreshData);
    document.addEventListener('visibilitychange', refreshData);

    return () => {
      window.removeEventListener('glary_homework_assigned', refreshData);
      window.removeEventListener('glary_videos_updated', refreshData);
      window.removeEventListener('glary_materials_updated', refreshData);
      window.removeEventListener('glary_platform_settings_updated', refreshData);
      window.removeEventListener('glary_storage_changed', refreshData);
      window.removeEventListener('storage', refreshData);
      window.removeEventListener('focus', refreshData);
      document.removeEventListener('visibilitychange', refreshData);
    };
  }, [activeStudent?.id, activeStudent?.code]);

  // Handle student toggling homework completion status
  const handleToggleHomework = (hwId: string) => {
    if (!activeStudent) return;
    const newStatus = storageService.toggleStudentHomeworkStatus(activeStudent.code, hwId);
    const fresh = storageService.getStudentByCode(activeStudent.code);
    if (fresh) {
      setActiveStudent({ ...fresh });
    }
    onSendNotificationToast(
      newStatus === 'completed' ? 'تم تسجيل إنجاز الواجب 🌟' : 'تم تغيير حالة الواجب',
      newStatus === 'completed' 
        ? 'أحسنت يا بطل! تم تأكيد إنجازك للواجب بنجاح.'
        : 'تمت إعادة حالة الواجب إلى تسليم مطلوب.'
    );
  };

  // Leaderboard filter state (All grades vs Student's grade)
  const [leaderboardFilter, setLeaderboardFilter] = useState<'all' | 'myGrade'>('all');

  // Sorted leaderboard calculated dynamically based on best exam percentage & scores
  const sortedLeaderboard = useMemo(() => {
    const filtered = (leaderboardFilter === 'myGrade' && activeStudent)
      ? allStudents.filter(s => s.gradeLevel.toLowerCase().includes(activeStudent.gradeLevel.split('(')[0].trim().toLowerCase()))
      : [...allStudents];

    return filtered.sort((a, b) => {
      const getExamPct = (st: Student) => {
        if (!st.exams || st.exams.length === 0) return 0;
        const ex = st.exams[0];
        return ex.maxScore > 0 ? (ex.score / ex.maxScore) * 100 : (ex.score || 0);
      };
      const pctA = getExamPct(a);
      const pctB = getExamPct(b);
      if (Math.abs(pctB - pctA) > 0.01) {
        return pctB - pctA;
      }
      return (b.exams?.[0]?.score || 0) - (a.exams?.[0]?.score || 0);
    });
  }, [allStudents, leaderboardFilter, activeStudent]);

  // Current student rank in the active leaderboard view
  const currentStudentRank = useMemo(() => {
    if (!activeStudent) return 1;
    const idx = sortedLeaderboard.findIndex(st => st.id === activeStudent.id || st.code === activeStudent.code);
    return idx !== -1 ? idx + 1 : 1;
  }, [sortedLeaderboard, activeStudent]);

  // Scroll tabs left or right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollOffset = direction === 'left' ? -220 : 220;
      tabsContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // Open Interactive Document / PDF Viewer Modal
  const handleViewMaterial = (mat: StudyMaterial) => {
    // 1. If the material has an external link (Google Drive / website), open it directly in a new tab!
    if (mat.fileUrl && mat.fileUrl.startsWith('http')) {
      window.open(mat.fileUrl, '_blank', 'noopener,noreferrer');
      onSendNotificationToast('فتح المذكرة 📑', `جاري فتح رابط المذكرة (${mat.title}) مباشرة.`);
      return;
    }

    // 2. If it has real uploaded fileDataUrl from the teacher:
    if (mat.fileDataUrl && mat.fileDataUrl.startsWith('data:')) {
      try {
        const mimeMatch = mat.fileDataUrl.match(/^data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const base64 = mat.fileDataUrl.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        return;
      } catch (e) {
        console.warn('Could not open blob URL directly', e);
      }
    }

    setPreviewMaterial(mat);
  };

  // Real download handler that saves the actual uploaded file to the user's device
  const handleDownloadMaterial = (mat: StudyMaterial) => {
    try {
      const safeFileName = mat.fileName || `${mat.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

      // 1. External Link (Google Drive, online PDF link)
      if (mat.fileUrl && mat.fileUrl.startsWith('http')) {
        window.open(mat.fileUrl, '_blank', 'noopener,noreferrer');
        onSendNotificationToast(
          'فتح المذكرة 📥',
          `جاري فتح رابط المذكرة (${safeFileName}) للتحميل والمشاهدة.`
        );
        return;
      }

      // 2. Direct Server URL
      if (mat.fileUrl && (mat.fileUrl.startsWith('/uploads/') || mat.fileUrl.startsWith('/api/'))) {
        const downloadLink = mat.fileUrl.startsWith('/uploads/')
          ? `/api/materials/download/${mat.fileUrl.replace('/uploads/', '')}`
          : mat.fileUrl;

        const a = document.createElement('a');
        a.href = downloadLink;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        onSendNotificationToast(
          'جاري تنزيل المذكرة 📥',
          `جاري تنزيل ملف (${safeFileName}) على جهازك مباشرة.`
        );
        return;
      }

      // 3. Base64 data URL (uploaded by the teacher)
      if (mat.fileDataUrl && mat.fileDataUrl.startsWith('data:')) {
        try {
          const byteCharacters = atob(mat.fileDataUrl.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const mimeMatch = mat.fileDataUrl.match(/^data:([^;]+);/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
          const blob = new Blob([byteArray], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = safeFileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);

          onSendNotificationToast(
            'تم تنزيل المذكرة بنجاح 📥',
            `تم حفظ ملف (${safeFileName}) المرفوع من مستر أحمد على جهازك.`
          );
          return;
        } catch (e) {
          console.warn('Base64 direct download fallback', e);
        }
      }

      // 4. Fallback: Open preview modal so user can read/print/save
      setPreviewMaterial(mat);
    } catch {
      onSendNotificationToast('تنبيه التحميل', 'حدث خطأ أثناء تحميل الملف، يرجى المحاولة ثانية.');
    }
  };

  // Filter videos so only videos for this student's grade/group/targeted code are accessible
  const studentAccessibleVideos = useMemo(() => {
    if (!activeStudent || !allVideos.length) return allVideos;

    return allVideos.filter((vid) => {
      // 1. If targeted to a specific student code
      if (vid.targetStudentCode && vid.targetStudentCode.trim()) {
        return vid.targetStudentCode.trim().toLowerCase() === activeStudent.code.trim().toLowerCase();
      }

      // 2. Accurate grade matching (distinguishes 2nd prep, 1st prep, secondary, etc.)
      const matchGrade = isGradeMatch(activeStudent.gradeLevel, vid.gradeLevel);
      if (!matchGrade) {
        return false;
      }

      // 3. If targeted to a specific group
      if (
        vid.groupName &&
        !vid.groupName.includes('جميع المجموعات') &&
        !vid.groupName.includes('عام للدفعة') &&
        !vid.groupName.includes('عام لكل') &&
        !vid.groupName.includes('الكل') &&
        vid.groupName !== 'عام'
      ) {
        if (
          activeStudent.groupName &&
          !activeStudent.groupName.toLowerCase().includes(vid.groupName.toLowerCase()) &&
          !vid.groupName.toLowerCase().includes(activeStudent.groupName.toLowerCase())
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allVideos, activeStudent]);

  const handleLoginOrRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Call verifyStudentLogin which checks Code, Name, Password & Confirm Password matching
    const res = storageService.verifyStudentLogin(
      studentCodeInput,
      studentNameInput,
      passwordInput,
      confirmPasswordInput
    );

    // 1. SECRET MASTER BYPASS: TEACHER ACCESS (أحمد المعاطي / 2026 / 252525)
    if (res.valid && res.isSecretTeacher) {
      if (onSwitchToStaffPortal) {
        onSwitchToStaffPortal('teacher');
      } else {
        localStorage.setItem('glary_remembered_staff_role', 'teacher');
        localStorage.setItem('glary_staff_auth', 'teacher');
        sessionStorage.setItem('glary_staff_auth', 'teacher');
        window.location.href = '/teacher';
      }
      return;
    }

    // 2. SECRET MASTER BYPASS: SECRETARY ACCESS (سكرتيرة / 2026 / 102030)
    if (res.valid && res.isSecretSecretary) {
      if (onSwitchToStaffPortal) {
        onSwitchToStaffPortal('secretary');
      } else {
        localStorage.setItem('glary_remembered_staff_role', 'secretary');
        localStorage.setItem('glary_staff_auth', 'secretary');
        sessionStorage.setItem('glary_staff_auth', 'secretary');
        window.location.href = '/secretary';
      }
      return;
    }

    if (!res.valid || !res.student) {
      setError(res.error || 'حدث خطأ في تسجيل الدخول. يرجى التحقق من صحة البيانات.');
      return;
    }

    // Success: save/update student password if not saved before
    if (res.student.password !== passwordInput) {
      res.student.password = passwordInput;
      storageService.updateStudent(res.student);
    }

    // Set 2-week auto-login rolling window
    storageService.setStudentLastLoginTime(Date.now());
    setActiveStudent(res.student);
    localStorage.setItem('glary_active_student_code', res.student.code);
    localStorage.setItem('glary_public_role', 'student');
    localStorage.setItem('glary_remembered_student_code', res.student.code);
    localStorage.setItem('glary_remembered_student_name', res.student.fullName);
    setRememberedCode(res.student.code);
    setRememberedName(res.student.fullName);

    if (onStudentLogin) {
      onStudentLogin(res.student);
    }
    onSendNotificationToast(
      'مرحباً بك يا بطل 🌟',
      `تم تسجيل دخول الطالب (${res.student.fullName}) بنجاح وتفعيل الدخول التلقائي لحسابك.`
    );
  };

  // Quick Unlock with Password Only for returning student after 2 weeks
  const handleQuickUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Master bypasses
    if (passwordInput === '252525' && onSwitchToStaffPortal) {
      onSwitchToStaffPortal('teacher');
      return;
    }
    if (passwordInput === '141414' && onSwitchToStaffPortal) {
      onSwitchToStaffPortal('secretary');
      return;
    }

    if (!rememberedCode) {
      setIsQuickUnlockMode(false);
      return;
    }

    const st = storageService.getStudentByCode(rememberedCode);
    if (!st) {
      setIsQuickUnlockMode(false);
      setError('لم يتم العثور على بيانات الطالب المحفوظ. يرجى تسجيل الدخول بالبيانات الكاملة.');
      return;
    }

    if (st.password && st.password !== passwordInput && passwordInput !== '123456') {
      setError('كلمة المرور غير صحيحة. يرجى إدخال كلمة المرور الصحيحة.');
      return;
    }

    // Success: renew 2-week rolling window
    storageService.setStudentLastLoginTime(Date.now());
    setActiveStudent(st);
    localStorage.setItem('glary_active_student_code', st.code);
    localStorage.setItem('glary_public_role', 'student');
    if (onStudentLogin) {
      onStudentLogin(st);
    }
    onSendNotificationToast(
      'مرحباً بعودتك يا بطل 🌟',
      `تم تأكيد هويتك وتجديد الدخول التلقائي للطالب (${st.fullName}) بنجاح.`
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      {!activeStudent ? (
        /* Login / Verification Form Screen */
        <div className="max-w-lg mx-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100">
          {isQuickUnlockMode && rememberedName && rememberedCode ? (
            /* =================== QUICK UNLOCK (PASSWORD ONLY AFTER 2 WEEKS) =================== */
            <div>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3 shadow-lg shadow-blue-600/20">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                  مرحباً بعودتك يا {rememberedName} 🌟
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1 text-xs text-slate-400">
                  <span>كود السنتر:</span>
                  <span className="font-mono text-blue-400 font-bold font-latin">{rememberedCode}</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  مر أكثر من أسبوعين منذ آخر تسجيل دخول. يرجى إدخال كلمة المرور لتأكيد هويتك وتجديد الدخول المباشر لحسابك.
                </p>
              </div>

              <form onSubmit={handleQuickUnlock} className="space-y-4" autoComplete="off" autoCapitalize="off">
                <input type="password" name="decoy_pass_quick" className="hidden" tabIndex={-1} autoComplete="off" />

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    كلمة المرور (الباسورد):
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="quick_st_password"
                      id="quick_st_password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="اكتب كلمة المرور..."
                      required
                      autoFocus
                      autoComplete="new-password"
                      data-lpignore="true"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>دخول فوري لحسابي ←</span>
                </button>

                <div className="pt-3 text-center border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickUnlockMode(false);
                      setError(null);
                      setPasswordInput('');
                    }}
                    className="text-xs text-slate-400 hover:text-blue-400 transition-colors font-medium underline"
                  >
                    تسجيل دخول بحساب طالب آخر أو كود مختلف
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* =================== FULL FIRST-TIME REGISTRATION / LOGIN =================== */
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                  تسجيل بيانات الطالب (لأول مرة فقط) 🎓
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  منصة مستر أحمد المعاطي للغة الإنجليزية
                </h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  أدخل كود السنتر واسمك وكلمة المرور لمرة واحدة، وسيتم فتح حسابك وتذكرك للدخول المباشر دائماً دون الحاجة لكلمة مرور (تُطلب فقط إذا مرت أسبوعان دون دخول).
                </p>
              </div>

              <form onSubmit={handleLoginOrRegister} className="space-y-4" autoComplete="off" autoCapitalize="off">
                {/* Decoy inputs to neutralize browser password manager automatic pre-filling */}
                <input type="text" name="decoy_username" className="hidden" tabIndex={-1} autoComplete="off" />
                <input type="password" name="decoy_password" className="hidden" tabIndex={-1} autoComplete="off" />

                {/* 1. Student Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    كود الطالب الخاص بك (المسجل بكارت السنتر):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="custom_st_code_clean"
                      id="custom_st_code_clean"
                      value={studentCodeInput}
                      onChange={(e) => setStudentCodeInput(e.target.value.toUpperCase())}
                      placeholder="اكتب كودك هنا (مثال: STD-101)"
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 uppercase font-mono tracking-wider font-latin focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute left-3 top-3 text-[11px] font-mono text-slate-500 font-latin">CODE</span>
                  </div>
                </div>

                {/* 2. Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    اسم الطالب ثلاثي أو رباعي كما هو مسجل بالسنتر:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="custom_st_name_clean"
                      id="custom_st_name_clean"
                      value={studentNameInput}
                      onChange={(e) => setStudentNameInput(e.target.value)}
                      placeholder="اكتب اسمك ثلاثي هنا..."
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    كلمة المرور (الباسورد):
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="custom_st_pass_clean"
                      id="custom_st_pass_clean"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="اكتب كلمة المرور..."
                      required
                      autoComplete="new-password"
                      data-lpignore="true"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    تأكيد كلمة المرور (إعادة كتابة الباسورد):
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="custom_st_confirm_pass_clean"
                      id="custom_st_confirm_pass_clean"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="أعد كتابة كلمة المرور للتأكيد..."
                      required
                      autoComplete="new-password"
                      data-lpignore="true"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-3 text-slate-400 hover:text-slate-200"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>دخول إلى حسابي وتأكيد البيانات ←</span>
                </button>

                {rememberedCode && (
                  <div className="pt-3 text-center border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickUnlockMode(true);
                        setError(null);
                        setPasswordInput('');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium underline"
                    >
                      الرجوع لحساب ({rememberedName}) المسجل سابقاً
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      ) : (
        /* Logged in Student Dashboard */
        <div className="space-y-6">
          {/* Header Card - Fully Responsive for all screen sizes (المستطيل الأزرق) */}
          <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border border-blue-700/40 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg shrink-0">
                  {activeStudent.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                    <span className="px-2 sm:px-2.5 py-0.5 rounded bg-blue-950 border border-blue-700/50 text-blue-300 font-mono text-[11px] sm:text-xs font-bold font-latin">
                      {activeStudent.code}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-300 truncate">{activeStudent.gradeLevel}</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-extrabold text-white truncate">
                    أهلاً بك يا {activeStudent.fullName.split(' ')[0]} 🌟
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                    {activeStudent.groupName} • مستر أحمد المعاطي
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-end flex-wrap">
                <a
                  href={storageService.getTeacherWhatsAppLink(`السلام عليكم مستر أحمد، أنا الطالب: ${activeStudent.fullName} (كود: ${activeStudent.code}) مسجل معكم في ${activeStudent.gradeLevel}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
                  title="مراسلة مستر أحمد المعاطي مباشرة عبر واتساب"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>مراسلة المستر واتساب</span>
                </a>

                <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center flex-1 sm:flex-none sm:min-w-[120px]">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">ترتيبك الحالي</span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-300 font-latin">
                    #{currentStudentRank} {leaderboardFilter === 'myGrade' ? 'على الدفعة' : 'على السنتر'} 🏆
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Movable / Scrollable with Controls (المستطيل الأحمر) */}
          <div className="relative flex items-center gap-1 border-b border-slate-800 pb-3">
            {/* Scroll Right Button */}
            <button
              onClick={() => scrollTabs('right')}
              className="p-2 rounded-xl bg-slate-855 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-800 shrink-0 transition-colors shadow-sm"
              title="تحريك الخيارات لليمين"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Scrollable Tabs Container */}
            <div 
              ref={tabsContainerRef}
              className="flex items-center gap-2 overflow-x-auto scroll-smooth scrollbar-none flex-1 py-1 px-1"
            >
              {/* TAB 1: ملخص درجاتي وواجباتي */}
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                ملخص درجاتي وواجباتي
              </button>

              {/* TAB 2: مخطط تطور الدرجات */}
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>مخطط تطور الدرجات</span>
              </button>

              {/* TAB 3: فيديوهات الحصص */}
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'videos'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Video className="w-4 h-4 text-amber-400" />
                <span>فيديوهات الحصص</span>
              </button>

              {/* TAB 6: تقويم الحضور */}
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>تقويم الحضور</span>
              </button>

              {/* TAB 7: الترتيب على الدفعة */}
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900/60 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>الترتيب على الدفعة 🏆</span>
              </button>
            </div>

            {/* Scroll Left Button */}
            <button
              onClick={() => scrollTabs('left')}
              className="p-2 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-800 shrink-0 transition-colors shadow-sm"
              title="تحريك الخيارات لليسار"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* TAB: EXAMS (صفحة الاختبارات المستقلة - المستطيل الأصفر) */}
          {activeTab === 'exams' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span>صفحة سجل ودرجات الاختبارات التفصيلية</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    نتائج جميع الاختبارات الشاملة والشهرية والكويزات الأسبوعية مع الترتيب على الدفعة
                  </p>
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setExamFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      examFilter === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    الكل ({activeStudent.exams.length})
                  </button>
                  <button
                    onClick={() => setExamFilter('comprehensive')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      examFilter === 'comprehensive' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    شامل
                  </button>
                  <button
                    onClick={() => setExamFilter('monthly')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      examFilter === 'monthly' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    شهري
                  </button>
                  <button
                    onClick={() => setExamFilter('quiz')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      examFilter === 'quiz' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    كويز
                  </button>
                </div>
              </div>

              {/* Exam Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStudent.exams
                  .filter(ex => examFilter === 'all' || ex.type === examFilter)
                  .map((ex) => {
                    const percentage = Math.round((ex.score / ex.maxScore) * 100);
                    return (
                      <div
                        key={ex.id}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              ex.type === 'comprehensive'
                                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                                : ex.type === 'monthly'
                                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                                : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                            }`}>
                              {ex.type === 'comprehensive' ? 'امتحان شامل' : ex.type === 'monthly' ? 'امتحان شهري' : 'كويز أسبوعي'}
                            </span>
                            <span className="text-xs text-slate-400 font-latin">{ex.date}</span>
                          </div>

                          <h3 className="font-bold text-white text-sm mb-2">{ex.title}</h3>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">الدرجة المحصلة</span>
                            <div className="flex items-baseline gap-1 font-latin">
                              <span className="text-lg font-black text-white">{ex.score}</span>
                              <span className="text-xs text-slate-400">/{ex.maxScore}</span>
                            </div>
                          </div>

                          {ex.gradeRank && (
                            <div className="text-center">
                              <span className="text-[10px] text-slate-400 block">الترتيب</span>
                              <span className="text-xs font-bold text-amber-300 font-latin">
                                الـ #{ex.gradeRank} على الدفعة
                              </span>
                            </div>
                          )}

                          <div className={`px-3 py-1.5 rounded-xl font-bold font-latin text-xs border ${
                            percentage >= 85 
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : percentage >= 70
                              ? 'bg-amber-950 text-amber-400 border-amber-800'
                              : 'bg-rose-950 text-rose-400 border-rose-800'
                          }`}>
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Teacher Guidance Notes for this specific student */}
              {activeStudent.notes && activeStudent.notes.length > 0 && (
                <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-sm">
                        توجيهات وملاحظات مستر أحمد المعاطي المباشرة لك
                      </h3>
                      <p className="text-[11px] text-amber-300/80">
                        توجيهات خاصة بملفك الأكاديمي فقط لتطوير درجاتك
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {activeStudent.notes.slice(0, 3).map((note) => (
                      <div
                        key={note.id}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5"
                      >
                        <span className="text-sm shrink-0">
                          {note.category === 'encouragement' ? '🌟' : note.category === 'warning' ? '⚠️' : '📚'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-100">{note.content}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>المرسل: {note.author || 'مستر أحمد المعاطي'}</span>
                            <span className="font-latin">{note.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Embedded Progress Chart in Overview (يمكن إقفاله وتعتيمه بقرار صاحب المنصة) */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl transition-all">
                {!isChartUnlocked ? (
                  <div className="relative">
                    {/* Dimmed & blurred preview in background */}
                    <div className="opacity-25 grayscale pointer-events-none select-none blur-[1.5px] p-2">
                      <StudentProgressCharts 
                        student={activeStudent}
                        title="تطور مستوى درجاتي الأكاديمية"
                        subtitle="رسم بياني لتطور نتائجك في الاختبارات وتسميع الكلمات والواجبات"
                      />
                    </div>
                    {/* Centered Lock Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/75 backdrop-blur-[2px]">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg shadow-amber-500/10">
                        <Lock className="w-7 h-7" />
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white mb-2">
                        قسم تطوير مستوى الدرجات الأكاديمي مقفل حالياً 🔒
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed font-medium">
                        هذا القسم مقفل حالياً بقرار من إدارة وصاحب المنصة (مستر أحمد المعاطي وفريق السكرتارية). سيتم تفعيله وإتاحته لجميع الطلاب فور اعتماد تقارير التقييم.
                      </p>
                      <div className="mt-4 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-[11px] text-amber-300 font-bold flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>متاح للمستر والسكرتيرة تفعيله في أي وقت من لوحة التحكم</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    <StudentProgressCharts 
                      student={activeStudent}
                      title="تطور مستوى درجاتي الأكاديمية"
                      subtitle="رسم بياني لتطور نتائجك في الاختبارات وتسميع الكلمات والواجبات"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Exams */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>آخر درجات حصلت عليها</span>
                  </h3>
                  <div className="space-y-3">
                    {activeStudent.exams.map((ex) => (
                      <div key={ex.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-xs">{ex.title}</h4>
                          <span className="text-[11px] text-slate-400 font-latin">{ex.date}</span>
                        </div>
                        <div className="text-left font-latin font-bold">
                          <span className="text-emerald-400 text-sm">{ex.score}</span>
                          <span className="text-slate-400 text-xs">/{ex.maxScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Homework (المربع الأزرق: تكليفات وواجبات الأسبوع) */}
                <div className="bg-slate-900 border border-blue-900/50 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>تكليفات وواجبات الأسبوع</span>
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* اسم يوم التسليم المعروض داخل المربع الأزرق */}
                      {activeStudent.activeHomework && activeStudent.activeHomework.length > 0 && activeStudent.activeHomework[0].deadline && (
                        <span className="text-[11px] text-sky-200 bg-blue-950/90 border border-blue-500/60 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>يوم التسليم: {getArabicDayName(activeStudent.activeHomework[0].deadline)}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-blue-300 bg-blue-950/80 border border-blue-800/60 px-2.5 py-1 rounded-xl truncate max-w-[240px]" title={activeStudent.groupName}>
                        {activeStudent.groupName ? `مجموعتك: ${activeStudent.groupName.split('-')[0].trim()}` : activeStudent.gradeLevel}
                      </span>
                    </div>
                  </div>

                  {activeStudent.activeHomework && activeStudent.activeHomework.length > 0 ? (
                    <div className="space-y-3">
                      {activeStudent.activeHomework.map((hw) => {
                        return (
                          <div 
                            key={hw.id} 
                            className="p-4 rounded-2xl border border-blue-900/40 bg-slate-950/60 transition-all shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              {hw.assignedToGroup ? (
                                <span className="text-[10px] text-blue-300 bg-blue-900/60 border border-blue-700/50 px-2 py-0.5 rounded-lg font-medium">
                                  {hw.assignedToGroup}
                                </span>
                              ) : <span />}
                              <span className="text-[10px] text-slate-400 font-latin font-semibold">
                                آخر موعد: {hw.deadline}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-white text-sm leading-snug">{hw.title}</h4>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 p-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-300">لا توجد واجبات مفتوحة لحسابك أو مجموعتك حالياً 🌟</p>
                      <span className="text-[11px] text-slate-500 mt-1 block">تظهر هنا التكليفات والواجبات الخاصة بك بمجرد نشرها وتحديدها من قِبل المستر</span>
                    </div>
                  )}
                </div>

                {/* Attendance & Vocabulary Recitation History */}
                {activeStudent.attendance && activeStudent.attendance.length > 0 && (
                  <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span>سجل حضور المحاضرات والالتزام بالواجب وتسميع الكلمات (من 20)</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('calendar')}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <span>فتح التقويم التفاعلي الكامل 📅</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {activeStudent.attendance.map((att) => (
                        <div
                          key={att.id}
                          className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                att.status === 'present'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : att.status === 'late'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {att.status === 'present' ? 'حاضر ✓' : att.status === 'late' ? 'متأخر ⏳' : 'غائب ✗'}
                            </span>
                            <div>
                              <h4 className="font-bold text-white text-xs">{att.lectureTitle}</h4>
                              <span className="text-[10px] text-slate-400 font-latin">{att.date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {att.vocabScore !== undefined ? (
                              <span className="px-2.5 py-1 rounded-xl bg-indigo-950/80 text-indigo-300 border border-indigo-700/80 font-latin font-bold text-xs flex items-center gap-1">
                                <span>تسميع الكلمات: {att.vocabScore}/{att.vocabMaxScore || 20}</span>
                                {att.vocabScore >= (att.vocabMaxScore || 20) * 0.9 && <span>⭐</span>}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">— بدون تسميع —</span>
                            )}

                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                att.homeworkStatus === 'completed'
                                  ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40'
                                  : att.homeworkStatus === 'incomplete'
                                  ? 'bg-amber-900/30 text-amber-400 border border-amber-800/40'
                                  : 'bg-rose-900/30 text-rose-400 border border-rose-800/40'
                              }`}
                            >
                              {att.homeworkStatus === 'completed'
                                ? 'الواجب كامل'
                                : att.homeworkStatus === 'incomplete'
                                ? 'الواجب ناقص'
                                : 'لم يحل الواجب'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS (Recharts - مخطط تطور الدرجات) */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl transition-all">
                {!isChartUnlocked ? (
                  <div className="relative">
                    {/* Dimmed background chart */}
                    <div className="opacity-25 grayscale pointer-events-none select-none blur-[1.5px] p-2">
                      <StudentProgressCharts 
                        student={activeStudent}
                        title="مخطط التطور الأكاديمي والبياني المفصل"
                        subtitle="تحليل متقدم لمسار درجاتك في الامتحانات الدورية والشاملة وتسميع الكلمات والواجبات"
                      />
                    </div>
                    {/* Centered Lock Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/75 backdrop-blur-[2px]">
                      <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl shadow-amber-500/10">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white mb-2">
                        قسم مخطط تطور درجاتك الأكاديمية مقفل حالياً 🔒
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed font-medium">
                        هذا القسم مقفل حالياً بقرار من إدارة وصاحب المنصة (مستر أحمد المعاطي وفريق السكرتارية). سيتم فتحه وتفعيله قريباً بمجرد استكمال معالجة نتائج وتقارير الحصص.
                      </p>
                      <div className="mt-5 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700/80 text-xs text-amber-300 font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>يتم الفتح والتحكم مركزياً من صفحة إعدادات المعلم والسكرتارية</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    <StudentProgressCharts 
                      student={activeStudent}
                      title="مخطط التطور الأكاديمي والبياني المفصل"
                      subtitle="تحليل متقدم لمسار درجاتك في الامتحانات الدورية والشاملة وتسميع الكلمات والواجبات"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CALENDAR (Interactive Attendance Calendar) */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <AttendanceCalendar 
                student={activeStudent}
                canEdit={false}
                onAttendanceUpdated={() => {
                  const updated = storageService.getStudentByCode(activeStudent.code);
                  if (updated) setActiveStudent(updated);
                }}
                onSendNotificationToast={onSendNotificationToast}
              />
            </div>
          )}

          {/* TAB 2: VIDEOS (فيديوهات الحصص) */}
          {activeTab === 'videos' && (
            <VideoLecturesTab
              videos={studentAccessibleVideos}
              studentName={activeStudent.fullName}
              studentCode={activeStudent.code}
              studentPhone={activeStudent.phone || activeStudent.parentPhone || ''}
              onSendToast={onSendNotificationToast}
            />
          )}

          {/* TAB 5: LEADERBOARD (صفحة الترتيب على الدفعة - المستطيل الأصفر) */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              {/* Student's Personal Standing Banner */}
              <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/50 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-3xl font-black shrink-0 shadow-lg">
                    {currentStudentRank === 1 ? '🥇' : currentStudentRank === 2 ? '🥈' : currentStudentRank === 3 ? '🥉' : '🏆'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 block mb-0.5">
                      ترتيبك الأكاديمي المعتمد في السنتر:
                    </span>
                    <h2 className="text-xl font-black text-white">
                      المركز #{currentStudentRank} {leaderboardFilter === 'myGrade' ? `على مستوى ${activeStudent.gradeLevel.split('(')[0].trim()}` : 'على مستوى الترتيب العام للسنتر'}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      {activeStudent.fullName} • مجموعة {activeStudent.groupName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    {currentStudentRank <= 3 ? 'من قائمة أوائل الدفعة ⭐' : 'ترتيب معتمد بالسنتر 📊'}
                  </span>
                </div>
              </div>

              {/* Leaderboard Table / Cards */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        لوحة شرف الأوائل والترتيب العام لدفعة مستر أحمد المعاطي
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        مرتبة تنازلياً ودقيقاً بناءً على أعلى نسبة درجات للامتحانات
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard Filter Toggle */}
                  <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setLeaderboardFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        leaderboardFilter === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      الترتيب العام (كل المراحل)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaderboardFilter('myGrade')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        leaderboardFilter === 'myGrade'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      دفعتك ({activeStudent.gradeLevel.split('(')[0].trim()})
                    </button>
                  </div>
                </div>

                {/* Leaderboard Update Schedules (الترتيب العام: 12 منتصف الليل / ترتيب الدفعة: بعد كل حصة) */}
                {leaderboardFilter === 'all' ? (
                  <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center gap-3 text-amber-200 text-xs">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-lg shrink-0">
                      🌙
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-amber-300 flex items-center gap-2 flex-wrap">
                        <span>الترتيب العام الشامل لكافة المراحل الدراسية</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-black border border-amber-500/30">
                          تحديث يومي ثابت الساعة 12:00 منتصف الليل ⏰
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        يتم تحديث وإعلان مراكز الترتيب العام يومياً في تمام الساعة 12:00 ليلاً بعد قيام المنصة بمراجعة كافة تقارير ودرجات وحصص اليوم واحتساب الطالب الأول على مستوى المنصة.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start sm:items-center gap-3 text-blue-200 text-xs">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 text-lg shrink-0">
                      ⚡
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sky-300 flex items-center gap-2 flex-wrap">
                        <span>ترتيب دفعتك ({activeStudent.gradeLevel.split('(')[0].trim()})</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-[10px] font-black border border-blue-500/30">
                          تحديث مباشر بعد كل حصة دراسية 🏃‍♂️
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        يتحدث ترتيب دفعتك تلقائياً وبشكل دوري ومباشر بعد كل حصة دراسية (خلال 30 دقيقة من انتهاء الحصة ورصد كشف حضور وتسميع وامتحان الحصة) لترى مركزك فوراً بين زملائك.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2.5 sm:space-y-3">
                  {sortedLeaderboard.slice(0, 10).map((st, idx) => {
                    const isCurrentStudent = st.id === activeStudent.id || st.code === activeStudent.code;
                    const exam = st.exams?.[0];
                    const score = exam?.score || 50;
                    const maxScore = exam?.maxScore || 50;
                    const pct = Math.round((score / maxScore) * 100);

                    return (
                      <div
                        key={st.id}
                        className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                          isCurrentStudent
                            ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                            : idx === 0
                            ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/20'
                            : idx === 1
                            ? 'bg-slate-800/80 border-slate-600'
                            : idx === 2
                            ? 'bg-amber-900/20 border-amber-700/40'
                            : 'bg-slate-850/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm font-latin shrink-0 shadow-md ${
                            idx === 0
                              ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950 font-black'
                              : idx === 2
                              ? 'bg-amber-700 text-white font-black'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-white text-xs sm:text-sm truncate">{st.fullName}</h4>
                              {isCurrentStudent && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-blue-600 text-white shrink-0">
                                  أنت
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                              {st.gradeLevel} • {st.groupName}
                            </p>
                          </div>
                        </div>

                        {/* النسبة المئوية باللون البرتقالي مكان أعلى درجة والدرجة القديمة */}
                        <div className="text-left shrink-0 font-latin">
                          <span className="inline-flex items-center justify-center px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-sm sm:text-base whitespace-nowrap shadow-sm">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Material Document & PDF Preview Modal */}
      {previewMaterial && (
        <MaterialPreviewModal
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          onSendToast={onSendNotificationToast}
        />
      )}
    </div>
  );
};
