import React, { useState, useMemo } from 'react';
import { 
  Search, 
  User, 
  GraduationCap, 
  Phone, 
  MessageCircle, 
  Award, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  BookOpen, 
  Eye, 
  ExternalLink,
  MapPin,
  Users,
  Filter,
  Plus,
  Receipt,
  Edit3
} from 'lucide-react';
import { Student, VocabRecord, PaymentRecord } from '../../types';
import { storageService } from '../../services/storage';
import { EditStudentModal } from './EditStudentModal';
import { TermMonthsManagerModal } from './TermMonthsManagerModal';
import { searchStudentsFuzzy, scoreStudentMatch } from '../../utils/studentSearch';

interface Props {
  students: Student[];
  onSelectStudentForNotes?: (student: Student) => void;
  onSelectStudentForGrades?: (student: Student) => void;
  onRefreshStudents?: () => void;
  onSendNotificationToast: (title: string, body: string) => void;
}

export const StudentSearchManager: React.FC<Props> = ({
  students,
  onSelectStudentForNotes,
  onSelectStudentForGrades,
  onRefreshStudents,
  onSendNotificationToast
}) => {
  // Input 1: Student Name with live suggestions
  const [nameQuery, setNameQuery] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  // Input 2: Student Age / Grade Year
  const [ageQuery, setAgeQuery] = useState<string>('all');

  // Dynamic Term Months managed by the Teacher
  const [termMonths, setTermMonths] = useState<string[]>(() => storageService.getTermMonths());
  const [isTermMonthsModalOpen, setIsTermMonthsModalOpen] = useState(false);

  // Student Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick Vocab adding state
  const [isAddVocabModalOpen, setIsAddVocabModalOpen] = useState(false);
  const [newVocabUnit, setNewVocabUnit] = useState('Unit 3: Vocabulary & Expressions');
  const [newVocabScore, setNewVocabScore] = useState(19);
  const [newVocabMaxScore, setNewVocabMaxScore] = useState(20);
  const [newVocabNotes, setNewVocabNotes] = useState('تسميع تحريري ممتاز وإتقان لمعاني الكلمات');
  const [newVocabDate, setNewVocabDate] = useState(new Date().toISOString().split('T')[0]);

  // Click outside to close suggestions
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students based on fuzzy name/token/code and age/year
  const searchResults = useMemo(() => {
    const ageFiltered = students.filter(st => {
      return ageQuery === 'all' || 
        (st.age && st.age.toString() === ageQuery) ||
        (ageQuery === '18' && (st.age === 18 || st.gradeLevel?.includes('الثالث الثانوي'))) ||
        (ageQuery === '17' && (st.age === 17 || st.gradeLevel?.includes('الثاني الثانوي'))) ||
        (ageQuery === '16' && (st.age === 16 || st.gradeLevel?.includes('الأول الثانوي')));
    });

    if (!nameQuery.trim()) {
      return ageFiltered;
    }

    return searchStudentsFuzzy(ageFiltered, nameQuery, 50);
  }, [students, nameQuery, ageQuery]);

  // Live Auto-complete Name Suggestions with close fuzzy matches
  const nameSuggestions = useMemo(() => {
    const trimmed = nameQuery.trim();
    if (!trimmed) return [];
    
    const ageFiltered = students.filter(st => {
      return ageQuery === 'all' || 
        (st.age && st.age.toString() === ageQuery) ||
        (ageQuery === '18' && (st.age === 18 || st.gradeLevel?.includes('الثالث الثانوي'))) ||
        (ageQuery === '17' && (st.age === 17 || st.gradeLevel?.includes('الثاني الثانوي'))) ||
        (ageQuery === '16' && (st.age === 16 || st.gradeLevel?.includes('الأول الثانوي')));
    });

    return searchStudentsFuzzy(ageFiltered, trimmed, 8);
  }, [students, nameQuery, ageQuery]);

  // Selected student to view full details
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(() => {
    return students[0] || null;
  });

  // Keep selected student synced if list changes
  React.useEffect(() => {
    if (selectedStudent) {
      const refreshed = students.find(s => s.id === selectedStudent.id);
      if (refreshed) {
        setSelectedStudent(refreshed);
      }
    } else if (searchResults.length > 0) {
      setSelectedStudent(searchResults[0]);
    }
  }, [students]);

  // Handle suggestion select
  const handleSelectSuggestion = (st: Student) => {
    setSelectedStudent(st);
    setNameQuery(st.fullName);
    setIsSuggestionsOpen(false);
  };

  // Toggle payment status for selected student
  const handleTogglePayment = (month: string, currentStatus?: 'paid' | 'pending') => {
    if (!selectedStudent) return;
    const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    storageService.togglePaymentStatus(selectedStudent.code, month, nextStatus);
    const refreshed = storageService.getStudentByCode(selectedStudent.code);
    if (refreshed) {
      setSelectedStudent({ ...refreshed });
    }
    onSendNotificationToast(
      'سجل المصروفات 💳',
      `تم تحديث حالة اشتراك (${month}) للطالب ${selectedStudent.fullName} إلى: ${nextStatus === 'paid' ? 'تم السداد بنجاح ✓' : 'مستحق / معلق ⏳'}`
    );
  };

  // Send WhatsApp payment receipt
  const handleSendWhatsAppReceipt = (month: string, payment?: PaymentRecord) => {
    if (!selectedStudent) return;
    const phone = selectedStudent.parentPhone || selectedStudent.phone;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;

    const msg = `السلام عليكم ورحمة الله وبركاته،\nإيصال سداد مصروفات منصة مستر أحمد المعاطي (خبير اللغة الإنجليزية):\n\nالطالب: ${selectedStudent.fullName}\nالكود: ${selectedStudent.code}\nالمرحلة: ${selectedStudent.gradeLevel}\nالشهر: ${month}\nالمبلغ: 250 ج.م\nرقم الإيصال: ${payment?.receiptNumber || 'REC-' + Date.now().toString().slice(-6)}\nحالة السداد: تم الدفع بنجاح ✓\nالتاريخ: ${payment?.paymentDate || new Date().toISOString().split('T')[0]}\n\nمع تمنياتنا بالتوفيق والتفوق الدائم!`;
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Save new vocab record
  const handleSaveNewVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const rec: VocabRecord = {
      id: `voc-${Date.now()}`,
      date: newVocabDate,
      unit: newVocabUnit,
      score: Number(newVocabScore),
      maxScore: Number(newVocabMaxScore),
      notes: newVocabNotes,
      passed: Number(newVocabScore) >= Number(newVocabMaxScore) * 0.6
    };

    storageService.addVocabRecord(selectedStudent.code, rec);
    const refreshed = storageService.getStudentByCode(selectedStudent.code);
    if (refreshed) {
      setSelectedStudent({ ...refreshed });
    }
    setIsAddVocabModalOpen(false);
    onSendNotificationToast(
      'سجل تسميع الكلمات 📚',
      `تم رصد تسميع (${newVocabScore}/${newVocabMaxScore}) للطالب ${selectedStudent.fullName} بنجاح.`
    );
  };

  // Calculations for selected student
  const academicStats = useMemo(() => {
    if (!selectedStudent || !selectedStudent.exams || selectedStudent.exams.length === 0) {
      return { totalExams: 0, averagePercent: 0, bestRank: null };
    }
    const exams = selectedStudent.exams;
    const totalScore = exams.reduce((acc, ex) => acc + ex.score, 0);
    const totalMax = exams.reduce((acc, ex) => acc + ex.maxScore, 0);
    const averagePercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const bestRank = Math.min(...exams.map(e => e.gradeRank || 999));

    return {
      totalExams: exams.length,
      averagePercent,
      bestRank: bestRank < 900 ? bestRank : null
    };
  }, [selectedStudent]);

  const attendanceStats = useMemo(() => {
    if (!selectedStudent || !selectedStudent.attendance || selectedStudent.attendance.length === 0) {
      return { total: 0, present: 0, late: 0, absent: 0, attendanceRate: 100 };
    }
    const att = selectedStudent.attendance;
    const present = att.filter(a => a.status === 'present').length;
    const late = att.filter(a => a.status === 'late').length;
    const absent = att.filter(a => a.status === 'absent').length;
    const attendanceRate = Math.round(((present + late * 0.5) / att.length) * 100);

    return { total: att.length, present, late, absent, attendanceRate };
  }, [selectedStudent]);

  // Direct WhatsApp helper
  const openWhatsApp = (phone: string, message: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '2' + clean;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search Form (asks for Student Name and Age/Year) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>البحث الشامل عن بيانات وسجل الطالب</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  المراحل الثانوية ومقترحات ذكية
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                حدد السن أو المرحلة وابدأ بكتابة اسم الطالب لتظهر لك مقترحات فورية تسهل الوصول لملفه
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-latin">
            نتائج البحث: <span className="font-bold text-blue-400">{searchResults.length}</span> طالب
          </div>
        </div>

        {/* Dual Input Search Query: 1. Student Name with LIVE SUGGESTIONS, 2. Student Age / Year based on teacher stages */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1">
          {/* Question 1: اسم الطالب + مقترحات تلقائية */}
          <div className="sm:col-span-8 relative" ref={searchContainerRef}>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>اسم الطالب (اكتب أول حروف وستظهر مقترحات فورية):</span>
              </span>
              {nameSuggestions.length > 0 && isSuggestionsOpen && (
                <span className="text-[10px] text-blue-400 font-medium animate-pulse">
                  {nameSuggestions.length} مقترح مطابق
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                value={nameQuery}
                onFocus={() => setIsSuggestionsOpen(true)}
                onChange={(e) => {
                  setNameQuery(e.target.value);
                  setIsSuggestionsOpen(true);
                }}
                placeholder="اكتب اسم الطالب (مثال: عمر خالد، سارة، مريم) أو كود السنتر..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
            </div>

            {/* LIVE AUTOCOMPLETE SUGGESTIONS POPUP (المقترحات لنفس الاسم أثناء الكتابة) */}
            {isSuggestionsOpen && nameSuggestions.length > 0 && (
              <div className="absolute top-full right-0 left-0 mt-1.5 z-40 bg-slate-900 border border-blue-500/50 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 bg-slate-950/90 text-[11px] text-slate-400 flex items-center justify-between font-medium">
                  <span>اختر من مقترحات الطلاب المطابقة:</span>
                  <span className="text-[10px] text-blue-400">انقر لفتح الملف فوراً</span>
                </div>
                {nameSuggestions.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(st)}
                    className="w-full text-right p-3 hover:bg-blue-600/15 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {st.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-300">
                            {st.fullName}
                          </h4>
                          {nameQuery.trim() && scoreStudentMatch(st, nameQuery).matchType === 'fuzzy' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 font-medium">
                              مقترح قريب
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {st.gradeLevel} • السن: {st.age || 18} سنة • هاتف: {st.phone}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-blue-300 font-mono text-[11px] font-latin font-bold">
                      {st.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question 2: سن الطالب / مرحلته حسب مراحل مستر أحمد */}
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>السن والمرحلة الدراسية (مراحل مستر أحمد):</span>
            </label>
            <select
              value={ageQuery}
              onChange={(e) => setAgeQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-semibold"
            >
              <option value="all">جميع الأعمار والمراحل الدراسية</option>
              <option value="18">سن 18 سنة (الصف الثالث الثانوي - الشهادة العامة)</option>
              <option value="17">سن 17 سنة (الصف الثاني الثانوي)</option>
              <option value="16">سن 16 سنة (الصف الأول الثانوي)</option>
            </select>
          </div>
        </div>

        {/* Quick horizontal chip list removed as requested */}
      </div>

      {/* Main Student Profile Dossier */}
      {selectedStudent ? (
        <div className="space-y-6">
          {/* 1. Header Card: Student Identity & Key Attributes */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              {/* Avatar + Main Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 border border-blue-400/40 text-white text-2xl sm:text-3xl font-black flex items-center justify-center shadow-lg shadow-blue-900/30">
                  {selectedStudent.fullName.charAt(0)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {/* Student Code */}
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-950 border border-blue-700/60 text-blue-300 font-mono text-xs font-bold font-latin">
                      كود الطالب: {selectedStudent.code}
                    </span>

                    {/* Student Age */}
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-950/70 border border-amber-700/60 text-amber-300 text-xs font-bold font-latin">
                      السن: {selectedStudent.age || 18} سنة
                    </span>

                    {/* Branch */}
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      فرع: {selectedStudent.branch || 'دمياط'}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    {selectedStudent.fullName}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-blue-400">{selectedStudent.gradeLevel}</span>
                    <span>•</span>
                    <span className="text-slate-400">{selectedStudent.groupName}</span>
                  </p>
                </div>
              </div>

              {/* Quick Actions (Add Note, Record Grade, Contact) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  title="تعديل بيانات الطالب (الاسم، المرحلة، الكود، الأرقام)"
                >
                  <Edit3 className="w-4 h-4 text-indigo-300" />
                  <span>تعديل بيانات الطالب ✏️</span>
                </button>

                {onSelectStudentForNotes && (
                  <button
                    onClick={() => onSelectStudentForNotes(selectedStudent)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>إضافة ملاحظة وتوجيه</span>
                  </button>
                )}

                {onSelectStudentForGrades && (
                  <button
                    onClick={() => onSelectStudentForGrades(selectedStudent)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>رصد درجة امتحان</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">متوسط الدرجات</span>
                <span className="text-base sm:text-lg font-black text-emerald-400 font-latin">
                  {academicStats.averagePercent}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">أعلى ترتيب في الدفعة</span>
                <span className="text-base sm:text-lg font-black text-amber-300 font-latin">
                  {academicStats.bestRank ? `#${academicStats.bestRank}` : 'متميز'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">نسبة الحضور</span>
                <span className="text-base sm:text-lg font-black text-blue-400 font-latin">
                  {attendanceStats.attendanceRate}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block mb-0.5">عدد الامتحانات المسجلة</span>
                <span className="text-base sm:text-lg font-black text-white font-latin">
                  {academicStats.totalExams} امتحان
                </span>
              </div>
            </div>
          </div>

          {/* 2. Contact Information Cards (Student Phone & Parent Phone) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Student Phone Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">رقم تليفون الطالب الشخصي</h3>
                    <span className="text-[10px] text-slate-400">للتواصل المباشر مع الطالب</span>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-blue-300 font-latin">
                  {selectedStudent.phone}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <a
                  href={`tel:${selectedStudent.phone}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>اتصال هاتفي</span>
                </a>

                <button
                  type="button"
                  onClick={() => openWhatsApp(selectedStudent.phone, `مرحباً بك يا ${selectedStudent.fullName}، رسالة من منصة مستر أحمد المعاطي بخصوص المتابعة الدراسية.`)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>محادثة واتساب</span>
                </button>
              </div>

              {/* Student Password Display (مفيد للسكرتارية والمعلم في حالة نسيان الطالب للباسورد) */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">باسورد دخول الطالب:</span>
                <span className="font-mono font-bold text-amber-300 font-latin">{selectedStudent.password || '123456'}</span>
              </div>
            </div>

            {/* Parent Phone Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">رقم تليفون ولي الأمر</h3>
                    <span className="text-[10px] text-slate-400">
                      {selectedStudent.fatherName || selectedStudent.motherName || 'هاتف ولي الأمر المعتمد'}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-amber-300 font-latin">
                  {selectedStudent.parentPhone || selectedStudent.phone}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <a
                  href={`tel:${selectedStudent.parentPhone || selectedStudent.phone}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>اتصال بولي الأمر</span>
                </a>

                <button
                  type="button"
                  onClick={() => openWhatsApp(
                    selectedStudent.parentPhone || selectedStudent.phone, 
                    `السلام عليكم ورحمة الله، تحياتنا لولي أمر الطالب (${selectedStudent.fullName}). تقرير المتابعة لمستر أحمد المعاطي.`
                  )}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب ولي الأمر</span>
                </button>
              </div>

              {/* Parents Account Registration Status */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">حساب الأب:</span>
                  {selectedStudent.fatherId ? (
                    <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      مسجل
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">متاح للتسجيل</span>
                  )}
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">حساب الأم:</span>
                  {selectedStudent.motherId ? (
                    <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      مسجلة
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">متاح للتسجيل</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. VOCAB RECITATION HISTORY (سجل تسميع الكلمات - مضاف حسب طلب المستخدم) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">سجل تسميع الكلمات والمفردات (Vocabulary Recitation)</h3>
                  <span className="text-[11px] text-slate-400">سجل تراكمي لدرجات التسميع بالحصة من 20 درجة</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddVocabModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ رصد تسميع جديد</span>
              </button>
            </div>

            {selectedStudent.vocabHistory && selectedStudent.vocabHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">الوحدة / موضوع التسميع</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الدرجة</th>
                      <th className="p-3">النسبة</th>
                      <th className="p-3">التقييم</th>
                      <th className="p-3">ملاحظات الحصة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedStudent.vocabHistory.map((rec) => {
                      const percent = Math.round((rec.score / rec.maxScore) * 100);
                      const isSuper = percent >= 85;
                      const isPassing = percent >= 60;
                      return (
                        <tr key={rec.id} className="hover:bg-slate-850/50">
                          <td className="p-3 font-bold text-white">{rec.unit}</td>
                          <td className="p-3 font-latin text-slate-400 text-[11px]">{rec.date}</td>
                          <td className="p-3 font-latin font-bold">
                            <span className={isSuper ? 'text-emerald-400' : isPassing ? 'text-amber-400' : 'text-rose-400'}>
                              {rec.score}
                            </span>
                            <span className="text-slate-500 text-[11px]">/{rec.maxScore}</span>
                          </td>
                          <td className="p-3 font-latin">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isSuper ? 'bg-emerald-950 text-emerald-300' : isPassing ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
                            }`}>
                              {percent}%
                            </span>
                          </td>
                          <td className="p-3">
                            {isSuper ? (
                              <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                ممتاز ⭐
                              </span>
                            ) : isPassing ? (
                              <span className="text-amber-400 font-bold text-[11px]">جيد جداً 👍</span>
                            ) : (
                              <span className="text-rose-400 font-bold text-[11px]">إعادة تسميع ⚠️</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {rec.notes || 'تسميع منضبط'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl">
                لا توجد تسميعات كلمات مسجلة لهذا الطالب حتى الآن. اضغط على "+ رصد تسميع جديد" لإضافة أول تسميع.
              </div>
            )}
          </div>

          {/* 4. MONTHLY TUITION PAYMENTS (سجل الدفع والمصروفات الشهري - مضاف حسب طلب المستخدم) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">سجل الدفع والاشتراكات الشهرية</h3>
                  <span className="text-[11px] text-slate-400">اشتراك الحصص: 250 ج.م شهرياً • سداد فوري وإرسال إيصال على واتساب</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTermMonthsModalOpen(true)}
                  className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="تخصيص وإضافة أشهر الترم الدراسي بنفسك"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>إدارة أشهر الترم (خاص بالمعلم) 🗓️</span>
                </button>

                <div className="text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-800/60 font-bold">
                  مسدد: {selectedStudent.payments?.filter(p => p.status === 'paid').length || 0} شهور
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {termMonths.map((month) => {
                const payment = selectedStudent.payments?.find(p => p.month === month);
                const isPaid = payment?.status === 'paid';

                return (
                  <div
                    key={month}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 ${
                      isPaid
                        ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-white">{month}</h4>
                        <span className="text-[10px] text-slate-400 font-latin font-bold">250 ج.م</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                        isPaid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isPaid ? 'تم السداد' : 'مستحق'}
                      </span>
                    </div>

                    {isPaid && (
                      <div className="text-[10px] text-slate-400 bg-slate-900/90 p-2 rounded-lg space-y-0.5 border border-slate-800">
                        <div>تاريخ: <span className="font-latin text-slate-200">{payment?.paymentDate || '2026-09-01'}</span></div>
                        <div>إيصال: <span className="font-mono text-emerald-300">{payment?.receiptNumber || 'REC-202601'}</span></div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleTogglePayment(month, payment?.status)}
                        className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                          isPaid
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        }`}
                      >
                        {isPaid ? 'تغيير لغير مسدد' : 'تسجيل السداد ✓'}
                      </button>

                      {isPaid && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReceipt(month, payment)}
                          title="إرسال إيصال السداد على واتساب لولي الأمر"
                          className="p-1 rounded-lg bg-emerald-700/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-600/40"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Academic Records (السجل الدراسي الكامل والامتحانات) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>السجل الدراسي والامتحانات ({selectedStudent.exams?.length || 0} اختبار)</span>
              </h3>
              <span className="text-xs text-slate-400">مرتب من الأحدث للأقدم</span>
            </div>

            {selectedStudent.exams && selectedStudent.exams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">اسم الامتحان</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الدرجة</th>
                      <th className="p-3">النسبة</th>
                      <th className="p-3">الترتيب</th>
                      <th className="p-3">تقييم مستر أحمد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {selectedStudent.exams.map((ex) => {
                      const percent = Math.round((ex.score / ex.maxScore) * 100);
                      const isHigh = percent >= 85;
                      return (
                        <tr key={ex.id} className="hover:bg-slate-850/50">
                          <td className="p-3 font-bold text-white">{ex.title}</td>
                          <td className="p-3 font-latin text-slate-400 text-[11px]">{ex.date}</td>
                          <td className="p-3 font-latin font-bold">
                            <span className={isHigh ? 'text-emerald-400' : 'text-amber-400'}>{ex.score}</span>
                            <span className="text-slate-500 text-[11px]">/{ex.maxScore}</span>
                          </td>
                          <td className="p-3 font-latin">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isHigh ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {percent}%
                            </span>
                          </td>
                          <td className="p-3 font-latin text-amber-400 font-bold">
                            {ex.gradeRank ? `#${ex.gradeRank}` : '-'}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {ex.feedback || 'أداء مستقر'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl">
                لا توجد امتحانات مسجلة لهذا الطالب حتى الآن.
              </div>
            )}
          </div>

          {/* 4. Attendance & Homework & Vocab Recitation Record (سجل الحضور وتسميع الكلمات والواجب) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Attendance & Vocab Recitation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>سجل الحضور وتسميع الكلمات (من 20)</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {attendanceStats.present} حضور • {attendanceStats.absent} غياب
                </span>
              </div>

              {selectedStudent.attendance && selectedStudent.attendance.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedStudent.attendance.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          att.status === 'present' ? 'bg-emerald-400' : att.status === 'late' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        <div>
                          <h4 className="font-bold text-white text-xs truncate max-w-[170px]">{att.lectureTitle}</h4>
                          <span className="text-[10px] text-slate-400 font-latin">{att.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {att.vocabScore !== undefined && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-latin font-bold text-[11px]">
                            تسميع: {att.vocabScore}/{att.vocabMaxScore || 20}
                          </span>
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
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl">
                  لا يوجد سجل حضور مسجل حتى الآن.
                </div>
              )}
            </div>

            {/* Teacher Notes & Guidance */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ملاحظات وتوجيهات مستر أحمد للطالب</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {selectedStudent.notes?.length || 0} ملاحظة
                </span>
              </div>

              {selectedStudent.notes && selectedStudent.notes.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedStudent.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300">
                          {note.category === 'encouragement' ? '🌟 تشجيع' : note.category === 'warning' ? '⚠️ تنبيه' : '📚 توجيه أكاديمي'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-latin">{note.date}</span>
                      </div>
                      <p className="text-slate-200 text-xs leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl">
                  لا توجد ملاحظات مسجلة لهذا الطالب حتى الآن.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
          لم يتم العثور على طالب يطابق معايير البحث. يرجى تعديل الاسم أو السن أعلاه.
        </div>
      )}
      {/* Modal: Quick Add Vocab */}
      {isAddVocabModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>رصد تسميع كلمات للطالب: {selectedStudent.fullName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVocabModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewVocab} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">الوحدة وموضوع الكلمات:</label>
                <input
                  type="text"
                  value={newVocabUnit}
                  onChange={(e) => setNewVocabUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">درجة الطالب:</label>
                  <input
                    type="number"
                    min="0"
                    max={newVocabMaxScore}
                    value={newVocabScore}
                    onChange={(e) => setNewVocabScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold font-latin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">من إجمالي:</label>
                  <input
                    type="number"
                    min="1"
                    value={newVocabMaxScore}
                    onChange={(e) => setNewVocabMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold font-latin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تاريخ التسميع:</label>
                <input
                  type="date"
                  value={newVocabDate}
                  onChange={(e) => setNewVocabDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-latin"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات المستر:</label>
                <textarea
                  rows={2}
                  value={newVocabNotes}
                  onChange={(e) => setNewVocabNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  placeholder="ملاحظات حول دقة الحفظ والنطق..."
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVocabModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  حفظ في السجل فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Student Information */}
      {isEditModalOpen && selectedStudent && (
        <EditStudentModal
          isOpen={isEditModalOpen}
          student={selectedStudent}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            if (onRefreshStudents) onRefreshStudents();
            // Refresh local selectedStudent from storage
            const updated = storageService.getStudentById(selectedStudent.id);
            if (updated) setSelectedStudent(updated);
          }}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}

      {/* Modal: Teacher Term Months Manager */}
      {isTermMonthsModalOpen && (
        <TermMonthsManagerModal
          isOpen={isTermMonthsModalOpen}
          onClose={() => setIsTermMonthsModalOpen(false)}
          onMonthsUpdated={(updatedMonths) => {
            setTermMonths(updatedMonths);
            if (onRefreshStudents) onRefreshStudents();
          }}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}
    </div>
  );
};
