import React, { useState, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  Award, 
  Calendar, 
  Send, 
  Database, 
  Download, 
  Upload, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Camera,
  MessageCircle,
  Phone,
  X,
  Settings,
  Video,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CreditCard,
  HardDrive
} from 'lucide-react';
import { Student, UserRole, ParentType } from '../../types';
import { storageService } from '../../services/storage';
import { TeacherSettingsModal } from './TeacherSettingsModal';
import { ResetAcademicYearModal } from './ResetAcademicYearModal';
import { TeacherContentManager } from './TeacherContentManager';
import { GroupGradeRecorder } from './GroupGradeRecorder';
import { TeacherNotesManager } from './TeacherNotesManager';
import { StudentSearchManager } from './StudentSearchManager';
import { StudentVocabAndPaymentTracker } from './StudentVocabAndPaymentTracker';
import { AttendanceCalendar } from '../common/AttendanceCalendar';
import { searchStudentsFuzzy } from '../../utils/studentSearch';
import { StudentFuzzySearchAutocomplete } from '../common/StudentFuzzySearchAutocomplete';
import { StudentProgressCharts } from '../common/StudentProgressCharts';
import { EditStudentModal } from './EditStudentModal';
import { PortalRole, downloadPortalShortcut } from '../../services/portalLinks';

interface Props {
  role: 'teacher' | 'secretary';
  onBackToRoles: () => void;
  onSendNotificationToast: (title: string, body: string) => void;
  onOpenTeacherStandaloneApp?: () => void;
  onOpenPWAInstall?: (targetRole?: PortalRole) => void;
}

export const TeacherDashboard: React.FC<Props> = ({ role, onBackToRoles, onSendNotificationToast, onOpenTeacherStandaloneApp, onOpenPWAInstall }) => {
  const [activeTab, setActiveTab] = useState<
    'students' | 'grades' | 'vocab' | 'payments' | 'attendance' | 'notes' | 'search' | 'content' | 'broadcast' | 'backup'
  >(role === 'teacher' ? 'grades' : 'students');
  const [students, setStudents] = useState<Student[]>(storageService.getStudents());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(students[0] || null);
  const [teacherPhoto, setTeacherPhoto] = useState<string>(() => storageService.getTeacherPhoto());
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  // Tabs scroll controller ref and state
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkTabsScroll = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const isAtStart = el.scrollLeft <= 5 && el.scrollLeft >= -5;
    const isAtEnd = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 10;
    setCanScrollLeft(!isAtEnd);
    setCanScrollRight(!isAtStart);
  };

  React.useEffect(() => {
    checkTabsScroll();
    const el = tabsContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkTabsScroll);
      window.addEventListener('resize', checkTabsScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
    };
  }, [students]);

  const handleScrollTabs = (direction: 'forward' | 'backward') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    // In RTL direction: negative or positive depending on browser implementation
    const delta = direction === 'forward' ? -280 : 280;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkTabsScroll, 320);
  };

  // Sub-mode for grades recording: 'group' (default, بالصف والمجموعة والامتحان) or 'single'
  const [gradesSubMode, setGradesSubMode] = useState<'group' | 'single'>('group');

  // Settings Modal State (خاص بالمعلم)
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Reset Year Modal State (حذف وتصفير بيانات السنة)
  const [showResetYearModal, setShowResetYearModal] = useState(false);

  // WhatsApp Number State configured by Teacher
  const [teacherWhatsApp, setTeacherWhatsApp] = useState<string>(() => storageService.getTeacherWhatsApp());
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [tempWhatsApp, setTempWhatsApp] = useState(teacherWhatsApp);

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = tempWhatsApp.trim();
    if (!cleanNum) return;
    storageService.setTeacherWhatsApp(cleanNum);
    setTeacherWhatsApp(cleanNum);
    setShowWhatsAppModal(false);
    onSendNotificationToast('تم تحديث رقم الواتساب 💬', `تم حفظ رقم الواتساب (${cleanNum}) بنجاح، وربطه بأزرار تواصل أولياء الأمور والطلاب.`);
  };

  const handleTeacherPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setTeacherPhoto(reader.result);
          storageService.setTeacherPhoto(reader.result);
          onSendNotificationToast('تم تحديث صورة المعلم 📸', 'تم حفظ الصورة الشخصية لمستر أحمد بنجاح.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // New Student Form State
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('الصف الثالث الثانوي');
  const [newGroup, setNewGroup] = useState('مجموعة النخبة - الأحد والأربعاء (5:00 م)');
  const [newPhone, setNewPhone] = useState('');

  // Edit Student Form State
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  // Add Grade Form State
  const [examTitle, setExamTitle] = useState('');
  const [examScore, setExamScore] = useState('');
  const [examMaxScore, setExamMaxScore] = useState('50');
  const [examType, setExamType] = useState<'comprehensive' | 'monthly' | 'weekly_quiz'>('monthly');
  const [examFeedback, setExamFeedback] = useState('');

  // Attendance Form State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [hwStatus, setHwStatus] = useState<'completed' | 'incomplete' | 'not_submitted'>('completed');
  const [vocabScore, setVocabScore] = useState<number>(20);
  const [vocabMaxScore, setVocabMaxScore] = useState<number>(20);
  const [attendanceNote, setAttendanceNote] = useState('');
  const [attendanceViewMode, setAttendanceViewMode] = useState<'calendar' | 'form'>('calendar');

  // Note Form State
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'academic' | 'encouragement' | 'warning'>('encouragement');

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');

  // Backup state
  const [backupJson, setBackupJson] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const reloadStudents = () => {
    const list = storageService.getStudents();
    setStudents(list);
    if (selectedStudentForAction) {
      const updated = list.find((s) => s.id === selectedStudentForAction.id);
      if (updated) setSelectedStudentForAction(updated);
    }
  };

  // Filter students using fuzzy intelligent matching (الطلاب المقتربين والأخطاء الإملائية)
  const filteredStudents = useMemo(() => {
    return searchStudentsFuzzy(students, searchQuery, 300);
  }, [students, searchQuery]);

  // Add Student Handler
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    if (storageService.getStudentByCode(newCode)) {
      alert('كود الطالب مسجل بالفعل لطالب آخر!');
      return;
    }

    const created = storageService.addStudent({
      code: newCode.trim().toUpperCase(),
      fullName: newName.trim(),
      gradeLevel: newGrade,
      groupName: newGroup,
      phone: newPhone.trim() || '01000000000',
      exams: [],
      attendance: [],
      notes: [
        {
          id: `n-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          author: 'مستر أحمد المعاطي',
          content: 'تم تسجيل الطالب في منصة جلري التعليمية.',
          category: 'encouragement'
        }
      ],
      payments: [
        {
          id: `pay-${Date.now()}`,
          month: 'شهر سبتمبر 2026',
          amount: 350,
          status: 'pending'
        }
      ]
    });

    setShowAddStudentModal(false);
    setNewCode('');
    setNewName('');
    setNewPhone('');
    reloadStudents();
    setSelectedStudentForAction(created);
    onSendNotificationToast('إضافة طالب جديد 🎓', `تم تسجيل الطالب ${created.fullName} بنجاح.`);
  };

  // Add Grade Handler
  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAction || !examTitle.trim() || !examScore) return;

    const scoreNum = parseFloat(examScore);
    const maxScoreNum = parseFloat(examMaxScore) || 50;

    selectedStudentForAction.exams.unshift({
      id: `e-${Date.now()}`,
      title: examTitle.trim(),
      date: new Date().toISOString().split('T')[0],
      score: scoreNum,
      maxScore: maxScoreNum,
      gradeRank: Math.floor(Math.random() * 5) + 1,
      totalStudents: 85,
      feedback: examFeedback.trim(),
      type: examType
    });

    storageService.updateStudent(selectedStudentForAction);
    reloadStudents();
    setExamTitle('');
    setExamScore('');
    setExamFeedback('');

    onSendNotificationToast(
      'تم رصد الدرجة بنجاح ⭐',
      `تم رصد درجة ${scoreNum}/${maxScoreNum} في (${examTitle}) للطالب ${selectedStudentForAction.fullName}، وتم إرسال إشعار فوري لولي الأمر.`
    );
  };

  // Record Attendance Handler
  const handleRecordAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAction) return;

    selectedStudentForAction.attendance.unshift({
      id: `att-${Date.now()}`,
      date: attendanceDate,
      lectureTitle: `Lecture ${selectedStudentForAction.attendance.length + 1}: English Mastery Session`,
      status: attendanceStatus,
      entryTime: attendanceStatus === 'present' ? '05:00 م' : attendanceStatus === 'late' ? '05:20 م' : undefined,
      homeworkStatus: hwStatus,
      vocabScore: attendanceStatus === 'absent' ? undefined : Number(vocabScore),
      vocabMaxScore: attendanceStatus === 'absent' ? undefined : (Number(vocabMaxScore) || 10),
      notes: attendanceNote.trim()
    });

    storageService.updateStudent(selectedStudentForAction);
    reloadStudents();
    setAttendanceNote('');

    onSendNotificationToast(
      'تسجيل الحضور والغياب 📅',
      `تم تسجيل حالة (${attendanceStatus === 'present' ? 'حاضر' : attendanceStatus === 'absent' ? 'غائب' : 'متأخر'}) للطالب ${selectedStudentForAction.fullName}.`
    );
  };

  // Add Note Handler
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAction || !noteContent.trim()) return;

    selectedStudentForAction.notes.unshift({
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: role === 'teacher' ? 'مستر أحمد المعاطي' : 'السكرتارية الإدارية',
      content: noteContent.trim(),
      category: noteCategory
    });

    storageService.updateStudent(selectedStudentForAction);
    reloadStudents();
    setNoteContent('');

    onSendNotificationToast(
      'إضافة ملاحظة جديدة ✍️',
      `تم حفظ الملاحظة للطالب ${selectedStudentForAction.fullName} وتحديث لوحة ولي الأمر.`
    );
  };

  // Broadcast Handler
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) return;

    storageService.addNotification({
      title: broadcastTitle.trim(),
      body: broadcastBody.trim(),
      type: 'announcement'
    });

    onSendNotificationToast(
      'تم إرسال الإشعار الفوري لجميع الهواتف 📢',
      `تم بث الإشعار: "${broadcastTitle}" لجميع الطلاب وأولياء الأمور.`
    );

    setBroadcastTitle('');
    setBroadcastBody('');
  };

  // Export Backup
  const handleExportBackup = () => {
    const json = storageService.exportFullBackup();
    setBackupJson(json);

    // Trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glary_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    onSendNotificationToast('تم تصدير النسخة الاحتياطية 💾', 'تم حفظ نسخة كاملة من بيانات المنصة على جهازك.');
  };

  // Import Backup
  const handleImportBackup = (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    const res = storageService.importBackup(backupJson);
    if (res.success) {
      setImportStatus('تم استعادة البيانات والنسخة الاحتياطية بنجاح!');
      reloadStudents();
      onSendNotificationToast('استعادة ناجحة 🔄', 'تم تحديث كافة بيانات الطلاب وأولياء الأمور من النسخة الاحتياطية.');
    } else {
      setImportStatus(res.error || 'فشل الاستيراد.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      {/* Hidden photo file input */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handleTeacherPhotoChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950/60 border border-slate-700/80 rounded-3xl p-6 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 to-blue-500 shadow-lg">
              <img
                src={teacherPhoto}
                alt="مستر أحمد المعاطي"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {role === 'teacher' ? 'لوحة إدارة المعلم ومتابعة الدرجات' : 'لوحة تحكم السكرتارية وإدارة الطلاب'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {role === 'teacher'
                ? 'رصد ومتابعة درجات الطلاب والكويزات، توجيه الملاحظات والتقييمات، وإرسال الإشعارات وتحديث هوية المنصة.'
                : 'تسجيل الطلاب الجدد، متابعة سجلات أولياء الأمور، تسجيل الحضور والغياب، وإدارة العمليات اليومية.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Student Button: Only for secretary ("وحطهم عند السكرتريه") */}
          {role === 'secretary' && (
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة طالب جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Tabs - Fully Interactive and Scrollable with smooth controls and all tabs visible */}
      <div className="relative mb-6 group">
        {/* Navigation scroll control button - Right/Forward */}
        <button
          type="button"
          onClick={() => handleScrollTabs('backward')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 border border-blue-500/40 text-blue-400 hover:text-white hover:bg-blue-600 shadow-xl flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105"
          title="تحريك التبويبات لليمين"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Navigation scroll control button - Left/Backward */}
        <button
          type="button"
          onClick={() => handleScrollTabs('forward')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 border border-blue-500/40 text-blue-400 hover:text-white hover:bg-blue-600 shadow-xl flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105"
          title="تحريك التبويبات لليسار لرؤية باقي الأقسام"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scrollable Tabs Track */}
        <div
          ref={tabsContainerRef}
          className="flex items-center gap-2 overflow-x-auto px-9 py-2 scrollbar-thin scrollbar-thumb-blue-600/40 scrollbar-track-slate-900/50 scroll-smooth"
        >
          {/* Tab 1: سجل الطلاب وأولياء الأمور - ONLY at Secretary */}
          {role === 'secretary' && (
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل الطلاب وأولياء الأمور ({students.length})</span>
            </button>
          )}

          {/* Tab 2: رصد الدرجات والكويزات */}
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'grades'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>رصد الدرجات والكويزات</span>
          </button>

          {/* Tab 3: سجل تسميع الكلمات والمفردات - NEW */}
          <button
            onClick={() => setActiveTab('vocab')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'vocab'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-850 hover:bg-slate-800 text-indigo-300 border border-indigo-900/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>سجل تسميع الكلمات</span>
          </button>

          {/* Tab 4: سجل المصروفات والدفع الشهري - NEW */}
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-850 hover:bg-slate-800 text-emerald-300 border border-emerald-900/40'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>سجل المصروفات والاشتراكات</span>
          </button>

          {/* Tab 5: تسجيل الحضور والغياب - ONLY at Secretary */}
          {role === 'secretary' && (
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>تسجيل الحضور والغياب</span>
            </button>
          )}

          {/* Tab 6: البحث عن طالب - Available for Teacher & Secretary */}
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Search className="w-4 h-4 text-sky-400" />
            <span>البحث عن طالب ومقترحات</span>
          </button>

          {/* Tab 7: ملاحظات المعلم وتوجيهاته - Teacher */}
          {role === 'teacher' && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'notes'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ملاحظات المعلم وتوجيهاته</span>
            </button>
          )}

          {/* Tab 8: رفع المحتوى (فيديوهات، امتحانات، واجبات) - Teacher */}
          {role === 'teacher' && (
            <button
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'content'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>رفع المحتوى (فيديوهات وكورسات)</span>
            </button>
          )}

          {/* Tab 9: إرسال إشعارات فورية */}
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'broadcast'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>إرسال إشعارات فورية</span>
          </button>

          {/* Tab 10: النسخ الاحتياطي وقوة التخزين */}
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>النسخ الاحتياطي وحذف السنة</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENTS DIRECTORY */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <StudentFuzzySearchAutocomplete
                students={students}
                onSelectStudent={(st) => {
                  setSearchQuery(st.fullName);
                  setSelectedStudentForAction(st);
                }}
                placeholder="ابحث باسم الطالب، الكود، الهاتف، أو أقرب مقترح..."
              />
            </div>

            <span className="text-xs text-slate-400 font-latin">
              إجمالي الطلاب: {filteredStudents.length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">الكود</th>
                    <th className="p-3.5">اسم الطالب</th>
                    <th className="p-3.5">المرحلة والمجموعة</th>
                    <th className="p-3.5">حالة تسجيل الأب (Father)</th>
                    <th className="p-3.5">حالة تسجيل الأم (Mother)</th>
                    <th className="p-3.5">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-850/50">
                      <td className="p-3.5 font-mono font-bold text-blue-300 font-latin">{st.code}</td>
                      <td className="p-3.5 font-bold text-white">{st.fullName}</td>
                      <td className="p-3.5">
                        <span className="block text-slate-200">{st.gradeLevel}</span>
                        <span className="text-[11px] text-slate-400">{st.groupName}</span>
                      </td>
                      <td className="p-3.5">
                        {st.fatherId ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            {st.fatherName || 'أب مسجل'}
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                            متاح للتسجيل
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {st.motherId ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            {st.motherName || 'أم مسجلة'}
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                            متاح للتسجيل
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForEdit(st);
                              setShowEditStudentModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold text-[11px] transition-colors flex items-center gap-1"
                            title="تعديل بيانات الطالب (الاسم، المرحلة، الكود، الأرقام)"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForAction(st);
                              setActiveTab('grades');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold text-[11px] transition-colors"
                          >
                            رصد درجة
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECORD GRADES */}
      {activeTab === 'grades' && (
        <div className="space-y-4">
          {/* Sub-mode navigation for Grades: Group (الافتراضي وفقاً للمطلوب) vs Single */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2 sm:p-2.5 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGradesSubMode('group')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  gradesSubMode === 'group'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>رصد درجات المجموعة (بالصف والمجموعة والامتحان)</span>
              </button>

              <button
                type="button"
                onClick={() => setGradesSubMode('single')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  gradesSubMode === 'single'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>رصد فردي لطالب واحد</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 hidden md:block pl-2">
              {gradesSubMode === 'group' 
                ? '👈 نظام الرصد الجماعي: تحديد الصف والمجموعة ثم اختيار امتحان سابق أو إنشاء امتحان جديد' 
                : '👈 نظام الرصد الفردي: اختيار طالب محدد وإدخال نتيجته'}
            </div>
          </div>

          {/* Group Grades Recorder (الأساسي والمطلوب) */}
          {gradesSubMode === 'group' ? (
            <GroupGradeRecorder
              role={role}
              students={students}
              onNotify={onSendNotificationToast}
              onStudentsUpdated={reloadStudents}
            />
          ) : (
            /* Single Student Grade Form */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Select Student Column */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <h3 className="font-bold text-white text-xs mb-2">اختر الطالب لرصد الدرجة:</h3>
                
                {/* Smart Fuzzy Search Autocomplete with close suggestions */}
                <div className="mb-3">
                  <StudentFuzzySearchAutocomplete
                    students={students}
                    selectedStudentId={selectedStudentForAction?.id}
                    onSelectStudent={(st) => setSelectedStudentForAction(st)}
                    placeholder="ابحث بالاسم، الكود، أو أقرب مقترح..."
                  />
                </div>

                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {students.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStudentForAction(st)}
                      className={`w-full p-2.5 rounded-xl text-right text-xs transition-all flex items-center justify-between ${
                        selectedStudentForAction?.id === st.id
                          ? 'bg-blue-600 text-white font-bold shadow-md'
                          : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="truncate max-w-[170px]">{st.fullName}</span>
                      <span className="font-mono text-[10px] font-latin opacity-80">{st.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-1">
                  رصد نتيجة امتحان للطالب:{' '}
                  <span className="text-blue-400">{selectedStudentForAction?.fullName}</span>
                </h3>
                <p className="text-xs text-slate-400 mb-5">
                  الكود: <span className="font-mono text-white font-latin">{selectedStudentForAction?.code}</span> • سيتم إرسال إشعار فوري لولي الأمر المسجل.
                </p>

                <form onSubmit={handleAddGrade} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان الاختبار / الكويز:</label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="مثال: كويز القواعد الأسبوعي (Inversion & Conditionals)"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">الدرجة المحصلة:</label>
                      <input
                        type="number"
                        step="0.5"
                        value={examScore}
                        onChange={(e) => setExamScore(e.target.value)}
                        placeholder="مثال: 48.5"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-latin focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">الدرجة العظمى:</label>
                      <input
                        type="number"
                        value={examMaxScore}
                        onChange={(e) => setExamMaxScore(e.target.value)}
                        placeholder="50"
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-latin focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">نوع الاختبار:</label>
                      <select
                        value={examType}
                        onChange={(e) => setExamType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="weekly_quiz">كويز أسبوعي</option>
                        <option value="monthly">امتحان شهري</option>
                        <option value="comprehensive">امتحان شامل</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظة / تعليق مستر أحمد على درجة الطالب:</label>
                    <textarea
                      value={examFeedback}
                      onChange={(e) => setExamFeedback(e.target.value)}
                      placeholder="مثال: أداء متميز جداً، إتقان ممتاز لسؤال الاختيارات وتركيز عالٍ."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    <span>حفظ الدرجة وإشعار ولي الأمر فوراً</span>
                  </button>
                </form>

                {/* Progress Chart for Selected Student */}
                {selectedStudentForAction && (
                  <div className="mt-6 pt-6 border-t border-slate-800">
                    <StudentProgressCharts 
                      student={selectedStudentForAction}
                      title={`تطور درجات الطالب: ${selectedStudentForAction.fullName}`}
                      subtitle="تحليل بياني بـ Recharts لدرجات الاختبارات الدورية وتسميع الكلمات"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: VOCABULARY TRACKER (سجل تسميع الكلمات - مضاف حسب طلب المعلم) */}
      {activeTab === 'vocab' && (
        <StudentVocabAndPaymentTracker
          students={students}
          onRefreshStudents={reloadStudents}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}

      {/* TAB: MONTHLY TUITION PAYMENTS (سجل المصروفات والدفع الشهري - مضاف حسب طلب المعلم) */}
      {activeTab === 'payments' && (
        <StudentVocabAndPaymentTracker
          students={students}
          onRefreshStudents={reloadStudents}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}

      {/* TAB 3: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-bold text-white text-xs mb-3">اختر الطالب:</h3>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {students.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStudentForAction(st)}
                  className={`w-full p-2.5 rounded-xl text-right text-xs transition-all flex items-center justify-between ${
                    selectedStudentForAction?.id === st.id
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="truncate max-w-[170px]">{st.fullName}</span>
                  <span className="font-mono text-[10px] font-latin opacity-80">{st.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            {/* View Mode Switcher Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  متابعة وتسجيل الحضور: <span className="text-blue-400">{selectedStudentForAction?.fullName}</span>
                </h3>
                <span className="text-xs text-slate-400 font-latin">الكود: {selectedStudentForAction?.code}</span>
              </div>

              <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    attendanceViewMode === 'calendar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>التقويم التفاعلي 📅</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceViewMode('form')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    attendanceViewMode === 'form'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>النموذج السريع 📝</span>
                </button>
              </div>
            </div>

            {selectedStudentForAction && attendanceViewMode === 'calendar' ? (
              <AttendanceCalendar 
                student={selectedStudentForAction}
                canEdit={true}
                onAttendanceUpdated={reloadStudents}
                onSendNotificationToast={onSendNotificationToast}
              />
            ) : selectedStudentForAction ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4">
                  تسجيل حضور وغياب الطالب: <span className="text-blue-400">{selectedStudentForAction.fullName}</span>
                </h3>

                <form onSubmit={handleRecordAttendance} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ الحصة:</label>
                      <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-latin"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">حالة الحضور:</label>
                      <select
                        value={attendanceStatus}
                        onChange={(e) => setAttendanceStatus(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                      >
                        <option value="present">حاضر (في الموعد)</option>
                        <option value="late">حاضر متأخر</option>
                        <option value="absent">غائب</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">التزام الواجب المنزلي:</label>
                    <select
                      value={hwStatus}
                      onChange={(e) => setHwStatus(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                    >
                      <option value="completed">حل الواجب كاملاً ومتقناً</option>
                      <option value="incomplete">حل جزئي / واجب ناقص</option>
                      <option value="not_submitted">لم يقم بحل الواجب</option>
                    </select>
                  </div>

                  {attendanceStatus !== 'absent' && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <span>درجة تسميع الكلمات (Vocabulary Recitation) 📝:</span>
                        </label>
                        <span className="text-[10px] text-slate-400">تسميع كلمات الوحدة</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">الدرجة المحصلة:</label>
                          <input
                            type="number"
                            min="0"
                            max={vocabMaxScore}
                            value={vocabScore}
                            onChange={(e) => setVocabScore(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-latin font-bold text-center focus:border-indigo-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">من (الدرجة العظمى):</label>
                          <input
                            type="number"
                            min="1"
                            value={vocabMaxScore}
                            onChange={(e) => setVocabMaxScore(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-latin font-bold text-center focus:border-indigo-500 focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      {/* Quick score selector pills */}
                      <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                        <span className="text-[10px] text-slate-500 shrink-0">اختيار سريع:</span>
                        {[20, 19, 18, 16, 14, 10, 0].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => setVocabScore(score)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-latin font-bold transition-all ${
                              vocabScore === score
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {score}/{vocabMaxScore}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظة السكرتارية على الحضور:</label>
                    <input
                      type="text"
                      value={attendanceNote}
                      onChange={(e) => setAttendanceNote(e.target.value)}
                      placeholder="مثال: حضر ومعه المذكرة وتم تسليم كارت المتابعة"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                  >
                    تأكيد وحفظ حالة الحضور والتسميع
                  </button>
                </form>

                {/* Recent Attendance & Vocab Records for Selected Student */}
                {selectedStudentForAction.attendance.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
                      <span>سجل الحضور والتسميع الأخير للطالب:</span>
                      <span className="text-[11px] text-slate-500 font-latin">({selectedStudentForAction.attendance.length} حصص مسجلة)</span>
                    </h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {selectedStudentForAction.attendance.slice(0, 5).map((att) => (
                        <div
                          key={att.id}
                          className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              att.status === 'present' ? 'bg-emerald-400' : att.status === 'late' ? 'bg-amber-400' : 'bg-rose-400'
                            }`} />
                            <span className="font-latin text-slate-400 text-[11px]">{att.date}</span>
                            <span className="text-white font-medium truncate max-w-[150px]">{att.lectureTitle}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {att.vocabScore !== undefined ? (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-latin font-bold text-[11px]">
                                تسميع: {att.vocabScore}/{att.vocabMaxScore || 20}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">بدون تسميع</span>
                            )}
                            <span className={`text-[10px] font-bold ${
                              att.homeworkStatus === 'completed' ? 'text-emerald-400' : att.homeworkStatus === 'incomplete' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {att.homeworkStatus === 'completed' ? 'واجب كامل ✓' : att.homeworkStatus === 'incomplete' ? 'ناقص ⚠️' : 'لم يحل ✗'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                يرجى اختيار طالب من القائمة لعرض التقويم وتسجيل الحضور.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SEARCH FOR STUDENT */}
      {activeTab === 'search' && (
        <StudentSearchManager
          students={students}
          onSelectStudentForNotes={(st) => {
            setSelectedStudentForAction(st);
            setActiveTab('notes');
          }}
          onSelectStudentForGrades={(st) => {
            setSelectedStudentForAction(st);
            setActiveTab('grades');
          }}
          onRefreshStudents={reloadStudents}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}

      {/* TAB 4: TEACHER NOTES & GUIDANCE */}
      {activeTab === 'notes' && (
        <TeacherNotesManager
          students={students}
          onStudentsUpdated={(updated) => setStudents(updated)}
          onSendNotificationToast={onSendNotificationToast}
          initialSelectedStudentId={selectedStudentForAction?.id}
        />
      )}

      {/* TAB 5: BROADCAST NOTIFICATIONS */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">إرسال إشعار فوري وتنبيه لجميع المشتركين</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            يصل هذا الإشعار كتنبيه لحظي (Push Notification) على هواتف الطلاب وأولياء الأمور
          </p>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان الإشعار:</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="مثال: موعد المحاضرة الإضافية ومراجعة ليلة الامتحان 🎯"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تفاصيل التنبيه:</label>
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="اكتب تفاصيل التنبيه هنا..."
                rows={4}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الإشعار الفوري الآن</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: BACKUP & HIGH LOAD STORAGE */}
      {activeTab === 'backup' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">إدارة التخزين عالي التحمل والنسخ الاحتياطي</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              نظام تخزين المنصة مهيأ لتحمل الضغط العالي مع مزامنة سريعة وتصدير كامل للبيانات لمنع فقدان أي درجة أو سجل حضور.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">إجمالي الطلاب</span>
                <span className="text-lg font-bold text-white font-latin">{students.length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">أولياء الأمور</span>
                <span className="text-lg font-bold text-blue-400 font-latin">{storageService.getParents().length}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">سجلات الامتحانات</span>
                <span className="text-lg font-bold text-amber-400 font-latin">
                  {students.reduce((acc, s) => acc + s.exams.length, 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">حالة الخادم</span>
                <span className="text-xs font-bold text-emerald-400">ممتازة (100%)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportBackup}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>تصدير نسخة احتياطية كاملة (JSON Backup)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('هل تريد إعادة تعيين البيانات إلى البيانات الافتراضية الأولية؟')) {
                    storageService.resetToDefault();
                    reloadStudents();
                    onSendNotificationToast('إعادة التعيين 🔄', 'تمت استعادة البيانات النموذجية الأولية للمنصة.');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                استعادة النموذج الأولي الافتراضي
              </button>
            </div>

            {/* زر حذف بيانات السنة الدراسية (تصفير العام الدراسي) */}
            <div className="mt-6 pt-5 border-t border-slate-800 bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>حذف بيانات السنة الدراسية (تصفير العام الدراسي)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                    يمسح هذا الخيار كافة سجلات وبيانات الطلاب وأولياء الأمور والكويزات والدرجات للسنة الحالية للبدء بسنة دراسية جديدة نظيفة، مع الحفاظ التام على حساب المعلم وحساب السكرتارية وكلمات المرور وهوية المنصة. يتطلب كلمة مرور المعلم للتأكيد.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetYearModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all shrink-0 self-start sm:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف بيانات السنة</span>
                </button>
              </div>
            </div>
          </div>

          {/* Import JSON form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-2">استيراد نسخة احتياطية من ملف:</h4>
            <form onSubmit={handleImportBackup} className="space-y-3">
              <textarea
                value={backupJson}
                onChange={(e) => setBackupJson(e.target.value)}
                placeholder="الصق محتوى ملف JSON هنا لاستعادة البيانات بالكامل..."
                rows={5}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono font-latin"
              />
              {importStatus && (
                <p className="text-xs font-bold text-emerald-400">{importStatus}</p>
              )}
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                استيراد وتحديث البيانات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: CONTENT MANAGER (فيديوهات، امتحانات، واجبات) */}
      {activeTab === 'content' && (
        <TeacherContentManager
          onNotify={onSendNotificationToast}
          onHomeworkAssigned={() => setStudents(storageService.getStudents())}
        />
      )}

      {/* Modal: Add Student */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">إضافة طالب جديد في منصة جلري</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">كود الطالب:</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="مثال: STD-105"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono font-latin"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">هاتف الطالب:</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="01012345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-latin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الطالب ثلاثي:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: كريم عادل إبراهيم"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">المرحلة الدراسية:</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="الصف الثالث الثانوي (General Secondary)">الصف الثالث الثانوي (General Secondary)</option>
                  <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">المجموعة والمواعيد:</label>
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  placeholder="مجموعة السبت والثلاثاء - 5:00 م"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  إضافة الطالب
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher WhatsApp Config Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-7 relative text-slate-100 overflow-hidden">
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">رقم واتساب مستر أحمد</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  الرقم المربوط بزر "مراسلة عبر الواتس" لجميع أولياء الأمور
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الهاتف (واتساب)
                </label>
                <input
                  type="tel"
                  value={tempWhatsApp}
                  onChange={(e) => setTempWhatsApp(e.target.value)}
                  placeholder="مثال: 01012345678"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-latin font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-center tracking-wider"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  عند ضغط ولي الأمر أو الطالب على زر "مراسلة عبر الواتس"، سيتم فتح محادثة واتساب مباشرة مع هذا الرقم.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ رقم الواتساب</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Platform & Passwords Settings Modal (خاص بالمعلم فقط) */}
      {role === 'teacher' && (
        <TeacherSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSettingsSaved={(msg) => onSendNotificationToast('إعدادات المنصة ⚙️', msg)}
        />
      )}

      {/* Reset Academic Year Modal (حذف بيانات السنة بكلمة مرور المعلم) */}
      <ResetAcademicYearModal
        isOpen={showResetYearModal}
        onClose={() => setShowResetYearModal(false)}
        onSuccess={() => {
          reloadStudents();
          onSendNotificationToast('تم تصفير بيانات السنة 🗑️', 'تم حذف سجلات الطلاب والكويزات للسنة الحالية بنجاح، المنصة جاهزة للسنة الجديدة!');
        }}
      />

      {/* Edit Student Modal */}
      {showEditStudentModal && selectedStudentForEdit && (
        <EditStudentModal
          isOpen={showEditStudentModal}
          student={selectedStudentForEdit}
          onClose={() => {
            setShowEditStudentModal(false);
            setSelectedStudentForEdit(null);
          }}
          onSuccess={() => {
            reloadStudents();
          }}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}
    </div>
  );
};
