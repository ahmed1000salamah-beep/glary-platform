import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  Award, 
  Calendar, 
  BookOpen, 
  FileText, 
  CreditCard, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  TrendingUp, 
  UserCheck, 
  Download,
  Share2,
  PhoneCall,
  Sparkles,
  ArrowRight,
  BookCheck,
  Languages,
  Eye,
  UserMinus
} from 'lucide-react';
import { Student, ParentAccount, StudyMaterial } from '../../types';
import { storageService } from '../../services/storage';
import { StudentProgressCharts } from '../common/StudentProgressCharts';
import { AttendanceCalendar } from '../common/AttendanceCalendar';
import { PortalRole } from '../../services/portalLinks';
import { MaterialPreviewModal } from '../materials/MaterialPreviewModal';

interface Props {
  parent: ParentAccount;
  student: Student;
  allParentStudents?: Student[];
  onSwitchStudent?: () => void;
  onRefreshStudent: () => void;
  onRefreshParent?: () => void;
  onSendNotificationToast: (title: string, body: string) => void;
  onOpenPWAInstall?: (targetRole?: PortalRole) => void;
}

export const ParentDashboard: React.FC<Props> = ({
  parent,
  student,
  allParentStudents,
  onSwitchStudent,
  onRefreshStudent,
  onRefreshParent,
  onSendNotificationToast,
  onOpenPWAInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'grades' | 'attendance' | 'notes' | 'homework' | 'finance' | 'contact'>('grades');
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySent, setInquirySent] = useState(false);
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => storageService.getMaterials());
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const handleConfirmUnlinkFromDashboard = () => {
    setUnlinkLoading(true);
    const res = storageService.unlinkStudentFromParent(parent.id, student.code);
    if (res.success) {
      onSendNotificationToast(
        'إلغاء المتابعة ⚠️',
        `تمت إزالة متابعة الطالب ${student.fullName} من حسابك بنجاح.`
      );
      setShowUnlinkModal(false);
      setUnlinkLoading(false);
      if (onRefreshParent) {
        onRefreshParent();
      }
      if (onSwitchStudent) {
        onSwitchStudent();
      }
    } else {
      setUnlinkLoading(false);
    }
  };

  const parentTabsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(true);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to update arrows visibility / styling
  const updateScrollIndicators = () => {
    const el = parentTabsRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentScroll = Math.abs(el.scrollLeft);
    setCanScrollRight(currentScroll > 10);
    setCanScrollLeft(currentScroll < maxScroll - 10);
  };

  useEffect(() => {
    updateScrollIndicators();
    const el = parentTabsRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollIndicators);
      window.addEventListener('resize', updateScrollIndicators);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, []);

  useEffect(() => {
    const handleDataChange = () => {
      setMaterials(storageService.getMaterials());
      if (onRefreshStudent) {
        onRefreshStudent();
      }
    };
    window.addEventListener('glary_materials_updated', handleDataChange);
    window.addEventListener('glary_storage_changed', handleDataChange);
    window.addEventListener('storage', handleDataChange);
    return () => {
      window.removeEventListener('glary_materials_updated', handleDataChange);
      window.removeEventListener('glary_storage_changed', handleDataChange);
      window.removeEventListener('storage', handleDataChange);
    };
  }, [onRefreshStudent]);

  const scrollTabs = (direction: 'forward' | 'backward') => {
    if (parentTabsRef.current) {
      const el = parentTabsRef.current;
      const amount = 300;
      // In RTL layout: forward (towards next tabs on the left) is -300, backward is +300
      const delta = direction === 'forward' ? -amount : amount;
      el.scrollBy({ left: delta, behavior: 'smooth' });
      setTimeout(updateScrollIndicators, 350);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!parentTabsRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - parentTabsRef.current.offsetLeft);
    setScrollLeftState(parentTabsRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !parentTabsRef.current) return;
    e.preventDefault();
    const x = e.pageX - parentTabsRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    parentTabsRef.current.scrollLeft = scrollLeftState - walk;
    updateScrollIndicators();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (parentTabsRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        parentTabsRef.current.scrollLeft += e.deltaY;
        updateScrollIndicators();
      }
    }
  };

  const handleTabClick = (tab: typeof activeTab, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(tab);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  // Real download handler for materials in parent dashboard
  const handleDownloadStudyMaterial = (mat: StudyMaterial) => {
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

      if (mat.fileDataUrl && mat.fileDataUrl.startsWith('data:')) {
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

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        onSendNotificationToast(
          'تم تنزيل المذكرة بنجاح 📥',
          `تم حفظ ملف (${safeFileName}) على جهازك.`
        );
        return;
      }

      // If neither is present, open preview modal
      setPreviewMaterial(mat);
    } catch (err) {
      console.warn('Material download error:', err);
      setPreviewMaterial(mat);
    }
  };

  // Statistics calculation
  const totalExams = student.exams.length;
  const avgScore = totalExams > 0
    ? Math.round(
        student.exams.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 100, 0) / totalExams
      )
    : 0;

  // Real download handler for parents
  const handleDownloadNotes = (title: string) => {
    try {
      const content = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title} - منصة مستر أحمد المعاطي</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
    body { font-family: 'Cairo', Arial, sans-serif; padding: 30px; background: #f8fafc; color: #0f172a; line-height: 1.8; }
    .header { background: #1e3a8a; color: white; padding: 25px; border-radius: 14px; text-align: center; margin-bottom: 25px; }
    .box { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
    h1 { margin: 0 0 10px; font-size: 24px; }
    h2 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>إعداد مستر أحمد المعاطي • مذكرات الثانوية العامة المعتمدة 2026</p>
  </div>
  <div class="box">
    <h2>ملخص القواعد والتطبيقات</h2>
    <p>مذكرة شاملة موجهة لأولياء الأمور والطلاب للمراجعة الدورية ومتابعة الدروس أولاً بأول.</p>
    <table>
      <thead>
        <tr><th>الوحدة</th><th>الموضوع الأكاديمي</th><th>أهم الملاحظات</th></tr>
      </thead>
      <tbody>
        <tr><td>Unit 1-3</td><td>Grammar & Vocabulary Mastery</td><td>حفظ الكلمات وتطبيق الأزمنة</td></tr>
        <tr><td>Unit 4-6</td><td>Translation & Essay Writing</td><td>صياغة الجمل الاحترافية بدون أخطاء</td></tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onSendNotificationToast('تم تحميل المذكرة 📥', `تم حفظ ملف (${title}) بنجاح على جهازك.`);
    } catch {
      onSendNotificationToast('تنبيه التحميل', 'حدث خطأ أثناء تحميل الملف.');
    }
  };

  const totalLectures = student.attendance.length;
  const presentCount = student.attendance.filter((a) => a.status === 'present').length;
  const absentCount = student.attendance.filter((a) => a.status === 'absent').length;
  const lateCount = student.attendance.filter((a) => a.status === 'late').length;
  const attendanceRate = totalLectures > 0 ? Math.round((presentCount / totalLectures) * 100) : 100;

  const completedHwCount = student.attendance.filter((a) => a.homeworkStatus === 'completed').length;
  const hwRate = totalLectures > 0 ? Math.round((completedHwCount / totalLectures) * 100) : 100;

  const vocabRecords = student.attendance.filter((a) => a.vocabScore !== undefined && a.status !== 'absent');
  const avgVocabPercent = vocabRecords.length > 0
    ? Math.round(
        vocabRecords.reduce((acc, curr) => acc + (curr.vocabScore! / (curr.vocabMaxScore || 10)) * 100, 0) /
          vocabRecords.length
      )
    : null;

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    // Send inquiry
    setInquirySent(true);
    const textCopy = inquiryText;
    setInquiryText('');

    onSendNotificationToast(
      'تم إرسال استفسارك بنجاح ✉️',
      `تم استلام رسالتك بخصوص الطالب ${student.fullName} وسيتم الرد خلال ساعات العمل.`
    );

    // Simulated reply after 3 seconds
    setTimeout(() => {
      onSendNotificationToast(
        'رد سكرتارية مستر أحمد المعاطي 💬',
        `أهلاً بحضرتك أ. ${parent.fullName}، تم استلام استفسارك: "${textCopy.substring(0, 30)}..." وجاري التنسيق مع مستر أحمد وإفادتكم.`
      );
    }, 3500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      {/* Top Controls: Switch between multiple children and option to unlink child if lessons stopped */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">الطالب الحالي للمتابعة:</span>
          <span className="text-xs font-bold text-white bg-blue-900/60 px-2.5 py-1 rounded-lg border border-blue-700/50">
            {student.fullName} ({student.code})
          </span>
          {allParentStudents && allParentStudents.length > 1 && (
            <button
              onClick={onSwitchStudent}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
            >
              <span>تبديل الطالب ({allParentStudents.length} طلاب)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowUnlinkModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-950/80 px-3 py-1.5 rounded-xl border border-rose-800/40 transition-all self-start sm:self-auto"
          title="إلغاء متابعة الطالب في حال توقف عن حضور الدرس"
        >
          <UserMinus className="w-3.5 h-3.5 text-rose-400" />
          <span>إلغاء متابعة الطالب (وقف الدرس)</span>
        </button>
      </div>

      {/* Main Student Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shadow-xl shrink-0">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-900/80 border border-blue-700/60 text-blue-300 font-mono text-xs font-bold font-latin">
                  {student.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  {parent.type === 'father' ? 'حساب الأب المعتمد' : 'حساب الأم المعتمد'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {student.fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 mt-1">
                <span>{student.gradeLevel}</span>
                <span>•</span>
                <span className="text-blue-300">{student.groupName}</span>
                <span>•</span>
                <span className="font-latin">هاتف الطالب: {student.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 block mb-0.5">مستر المادة</span>
              <span className="text-xs font-bold text-amber-300">أ. أحمد المعاطي</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 block mb-0.5">حالة القيد</span>
              <span className="text-xs font-bold text-emerald-400">منتظم ونشط ✓</span>
            </div>
          </div>
        </div>

        {/* 4 Primary Academic KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>متوسط الدرجات</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-latin ${avgScore >= 85 ? 'text-emerald-400' : avgScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                {avgScore}%
              </span>
              <span className="text-[10px] text-slate-400 font-latin">({totalExams} اختبارات)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>نسبة الحضور</span>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-blue-400 font-latin">{attendanceRate}%</span>
              <span className="text-[10px] text-slate-400 font-latin">({presentCount} من {totalLectures})</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>التزام الواجبات</span>
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-indigo-400 font-latin">{hwRate}%</span>
              <span className="text-[10px] text-slate-400 font-latin">({completedHwCount} واجب)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>مرات الغياب</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-latin ${absentCount === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {absentCount}
              </span>
              <span className="text-[10px] text-slate-400 font-latin">(تأخير: {lateCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Smooth Horizontal Carousel & Dragging */}
      <div className="relative mb-6">
        <div className="flex items-center gap-2">
          {/* Scroll Right Button (للعودة للبداية في الواجهة العربية) */}
          <button
            type="button"
            onClick={() => scrollTabs('backward')}
            className={`flex items-center justify-center p-2.5 rounded-xl border transition-all shrink-0 shadow-lg active:scale-95 ${
              canScrollRight 
                ? 'bg-blue-600/30 hover:bg-blue-600 text-white border-blue-500/50 cursor-pointer' 
                : 'bg-slate-850 text-slate-400 hover:text-white border-slate-700 hover:bg-slate-750'
            }`}
            title="تمرير لليمين (الأقسام الأولى)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Draggable & Scrollable Tabs Container */}
          <div 
            ref={parentTabsRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            className={`flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-none scroll-smooth touch-pan-x flex-1 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <button
              onClick={(e) => handleTabClick('grades', e)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'grades'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>سجل الدرجات والاختبارات ({student.exams.length})</span>
            </button>

            <button
              onClick={(e) => handleTabClick('attendance', e)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'attendance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>سجل الحضور والغياب والواجب ({student.attendance.length})</span>
            </button>

            <button
              onClick={(e) => handleTabClick('notes', e)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'notes'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>ملاحظات مستر أحمد الشخصية ({student.notes.length})</span>
            </button>

            <button
              onClick={(e) => handleTabClick('homework', e)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'homework'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>الواجبات والتكليفات</span>
            </button>

            <button
              onClick={(e) => handleTabClick('finance', e)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'finance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/40'
                  : 'bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>المصروفات والاشتراك</span>
            </button>
          </div>

          {/* Scroll Left Button (للتحرك نحو باقي الخيارات لليسار) */}
          <button
            type="button"
            onClick={() => scrollTabs('forward')}
            className={`flex items-center justify-center p-2.5 rounded-xl border transition-all shrink-0 shadow-lg active:scale-95 ${
              canScrollLeft 
                ? 'bg-blue-600/30 hover:bg-blue-600 text-white border-blue-500/50 cursor-pointer animate-pulse' 
                : 'bg-slate-850 text-slate-400 hover:text-white border-slate-700 hover:bg-slate-750'
            }`}
            title="تمرير لليسار (رؤية باقي الأقسام والمذكرات والمصروفات)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* TAB 1: GRADES & EXAMS */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          {/* Recharts Progress Analytics Component */}
          <StudentProgressCharts 
            student={student} 
            title="تطور درجات ونتائج الطالب في الاختبارات والواجبات"
            subtitle="تحليل بياني تفاعلي باستخدام Recharts يوضح مسار تطور درجات الاختبارات الدورية وتسميع الكلمات"
          />

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>تفاصيل كروت الاختبارات الدورية والشاملة</span>
            </h2>
            <span className="text-xs text-slate-400 font-latin">
              مرتبة من الأحدث إلى الأقدم ({student.exams.length} اختبار)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {student.exams.map((exam) => {
              const percentage = Math.round((exam.score / exam.maxScore) * 100);
              return (
                <div
                  key={exam.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          exam.type === 'comprehensive'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                            : exam.type === 'monthly'
                            ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                            : 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
                        }`}>
                          {exam.type === 'comprehensive' ? 'امتحان شامل' : exam.type === 'monthly' ? 'امتحان شهري' : 'كويز أسبوعي'}
                        </span>
                        <span className="text-xs text-slate-400 font-latin">{exam.date}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{exam.title}</h3>
                    </div>

                    <div className="flex items-center gap-4">
                      {exam.gradeRank && (
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">الترتيب</span>
                          <span className="text-xs font-bold text-amber-300 font-latin">
                            الـ {exam.gradeRank} من {exam.totalStudents || 85}
                          </span>
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center min-w-[90px]">
                        <span className="text-[10px] text-slate-400 block">الدرجة المحصلة</span>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-lg font-black text-white font-latin">{exam.score}</span>
                          <span className="text-xs text-slate-400 font-latin">/{exam.maxScore}</span>
                        </div>
                      </div>

                      <div className={`px-3 py-2 rounded-xl text-center font-bold text-sm font-latin ${
                        percentage >= 85 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        percentage >= 70 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {percentage}%
                      </div>
                    </div>
                  </div>

                  {exam.feedback && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-blue-200 bg-blue-950/20 p-3 rounded-xl border border-blue-900/40 flex items-start gap-2">
                      <span className="font-bold text-amber-300 shrink-0">تعليق مستر أحمد:</span>
                      <p className="leading-relaxed">"{exam.feedback}"</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE & HOMEWORK */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Interactive Attendance Calendar */}
          <AttendanceCalendar 
            student={student} 
            canEdit={false} 
            onAttendanceUpdated={onRefreshStudent}
            onSendNotificationToast={onSendNotificationToast}
          />

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <span>جدول تفصيلي لجميع سجلات الحضور السابقة</span>
            </h2>
            <span className="text-xs text-slate-400 font-latin">
              إجمالي {student.attendance.length} حصة مسجلة
            </span>
          </div>

          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr className="whitespace-nowrap">
                    <th className="p-3.5">تاريخ المحاضرة</th>
                    <th className="p-3.5">عنوان الدرس / المحاضرة</th>
                    <th className="p-3.5 text-indigo-300 text-center">درجة التسميع (من 20) 📝</th>
                    <th className="p-3.5">حالة الحضور</th>
                    <th className="p-3.5">وقت الدخول</th>
                    <th className="p-3.5">الواجب المنزلي</th>
                    <th className="p-3.5">ملاحظة السكرتارية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {student.attendance.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-850/50 transition-colors whitespace-nowrap">
                      <td className="p-3.5 font-latin font-bold text-white">{att.date}</td>
                      <td className="p-3.5 font-medium whitespace-normal min-w-[180px]">{att.lectureTitle}</td>
                      <td className="p-3.5 text-center">
                        {att.status === 'absent' ? (
                          <span className="text-slate-500 font-semibold text-[11px]">— لم يُسمّع (غائب) —</span>
                        ) : att.vocabScore !== undefined ? (
                          <div className="inline-flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold font-latin border ${
                              att.vocabScore >= (att.vocabMaxScore || 20) * 0.9
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80 shadow-sm shadow-emerald-950/40'
                                : att.vocabScore >= (att.vocabMaxScore || 20) * 0.7
                                ? 'bg-blue-950/80 text-blue-300 border-blue-700/80'
                                : att.vocabScore >= (att.vocabMaxScore || 20) * 0.5
                                ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                                : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                            }`}>
                              <span className="font-black text-sm">{att.vocabScore} / {att.vocabMaxScore || 20}</span>
                              {att.vocabScore >= (att.vocabMaxScore || 20) * 0.9 && (
                                <span className="text-xs">⭐</span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                              {att.vocabScore >= (att.vocabMaxScore || 20) * 0.9
                                ? 'ممتاز'
                                : att.vocabScore >= (att.vocabMaxScore || 20) * 0.7
                                ? 'جيد جداً'
                                : att.vocabScore >= (att.vocabMaxScore || 20) * 0.5
                                ? 'متوسط'
                                : 'يحتاج إعادة'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">لم يُرصد بعد</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {att.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            حاضر
                          </span>
                        ) : att.status === 'absent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold whitespace-nowrap">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            غائب
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            متأخر
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-latin text-slate-400">{att.entryTime || '—'}</td>
                      <td className="p-3.5">
                        {att.homeworkStatus === 'completed' ? (
                          <span className="text-emerald-400 font-bold whitespace-nowrap">حل كامل ✓</span>
                        ) : att.homeworkStatus === 'incomplete' ? (
                          <span className="text-amber-400 font-bold whitespace-nowrap">حل جزئي / ناقص ⚠️</span>
                        ) : (
                          <span className="text-rose-400 font-bold whitespace-nowrap">لم يحل ✗</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-400 italic whitespace-normal max-w-xs">{att.notes || 'لا توجد ملاحظات'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Shown on Mobile, Hidden on Desktop */}
          <div className="md:hidden space-y-4">
            {student.attendance.map((att) => (
              <div key={att.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                {/* Header: Date & Attendance Status badge */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white font-latin">{att.date}</span>
                    <span className="text-[10px] text-slate-400 font-latin">وقت الدخول: {att.entryTime || '—'}</span>
                  </div>
                  <div>
                    {att.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        حاضر
                      </span>
                    ) : att.status === 'absent' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold whitespace-nowrap">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        غائب
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold whitespace-nowrap">
                        <Clock className="w-3 h-3 text-amber-400" />
                        متأخر
                      </span>
                    )}
                  </div>
                </div>

                {/* Lecture Title */}
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">عنوان الدرس / المحاضرة:</span>
                  <p className="text-xs font-semibold text-white leading-relaxed">{att.lectureTitle}</p>
                </div>

                {/* Recitation Score & Homework Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Recitation */}
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between min-h-[68px]">
                    <span className="text-[10px] text-slate-400 block mb-1">درجة التسميع:</span>
                    {att.status === 'absent' ? (
                      <span className="text-slate-500 font-semibold text-[10px] whitespace-nowrap">لم يُسمّع (غائب)</span>
                    ) : att.vocabScore !== undefined ? (
                      <div className="flex flex-col gap-1">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold font-latin border w-fit ${
                          att.vocabScore >= (att.vocabMaxScore || 20) * 0.9
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                            : att.vocabScore >= (att.vocabMaxScore || 20) * 0.7
                            ? 'bg-blue-950/80 text-blue-300 border-blue-700/80'
                            : att.vocabScore >= (att.vocabMaxScore || 20) * 0.5
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                            : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                        }`}>
                          <span className="font-black text-xs">{att.vocabScore} / {att.vocabMaxScore || 20}</span>
                          {att.vocabScore >= (att.vocabMaxScore || 20) * 0.9 && <span className="text-[9px]">⭐</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {att.vocabScore >= (att.vocabMaxScore || 20) * 0.9
                            ? 'ممتاز'
                            : att.vocabScore >= (att.vocabMaxScore || 20) * 0.7
                            ? 'جيد جداً'
                            : att.vocabScore >= (att.vocabMaxScore || 20) * 0.5
                            ? 'متوسط'
                            : 'يحتاج إعادة'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px] italic">لم يُرصد بعد</span>
                    )}
                  </div>

                  {/* Homework */}
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between min-h-[68px]">
                    <span className="text-[10px] text-slate-400 block mb-1">الواجب المنزلي:</span>
                    {att.homeworkStatus === 'completed' ? (
                      <span className="text-emerald-400 font-bold text-xs">حل كامل ✓</span>
                    ) : att.homeworkStatus === 'incomplete' ? (
                      <span className="text-amber-400 font-bold text-xs">حل جزئي ⚠️</span>
                    ) : (
                      <span className="text-rose-400 font-bold text-xs">لم يحل ✗</span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {att.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 italic">
                    <span className="font-bold text-slate-500 block not-italic text-[9px] mb-0.5">ملاحظة السكرتارية:</span>
                    "{att.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TEACHER NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>ملاحظات وتوجيهات مستر أحمد المعاطي المباشرة</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {student.notes.map((note) => (
              <div
                key={note.id}
                className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-700/80 shadow-md relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-sm font-bold text-white">{note.author}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-latin">{note.date}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                  "{note.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HOMEWORK & STUDY MATERIALS */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          {/* Active Homework */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>الواجبات والتكليفات الحالية (تكليفات الأسبوع)</span>
              </h3>
              <span className="text-[10px] text-blue-300 bg-blue-950/80 border border-blue-800/60 px-2.5 py-1 rounded-xl">
                مجموعة الطالب: {student.groupName}
              </span>
            </div>

            {student.activeHomework && student.activeHomework.length > 0 ? (
              <div className="space-y-3">
                {student.activeHomework.map((hw) => (
                  <div
                    key={hw.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-bold">
                          الموعد النهائي: {hw.deadline}
                        </span>
                        <span className="text-emerald-400 text-xs font-bold">
                          {hw.status === 'completed' ? 'تم التسليم والمراجعة ✓' : 'بانتظار التسليم'}
                        </span>
                        {hw.assignedToGroup && (
                          <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-lg">
                            تكليف لمجموعة: {hw.assignedToGroup}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-sm">{hw.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{hw.instructions}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                لا توجد واجبات مفتوحة لمجموعة الطالب حالياً.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL SUBSCRIPTIONS */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>حالة الاشتراكات الشهرية والمصروفات</span>
          </h2>

          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr className="whitespace-nowrap">
                    <th className="p-3.5">البند / الشهر</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">تاريخ السداد</th>
                    <th className="p-3.5">رقم الإيصال</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {student.payments.map((p) => (
                    <tr key={p.id} className="whitespace-nowrap">
                      <td className="p-3.5 font-bold text-white">{p.month}</td>
                      <td className="p-3.5 font-latin font-bold text-amber-300">{p.amount} ج.م</td>
                      <td className="p-3.5">
                        {p.status === 'paid' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold whitespace-nowrap">
                            تم السداد بنجاح ✓
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold whitespace-nowrap">
                            معلق / مطلوب السداد
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-latin text-slate-400">{p.paymentDate || '—'}</td>
                      <td className="p-3.5 font-latin text-blue-300">{p.receiptNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Shown on Mobile, Hidden on Desktop */}
          <div className="md:hidden space-y-4">
            {student.payments.map((p) => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <span className="text-xs font-bold text-white">{p.month}</span>
                  <div>
                    {p.status === 'paid' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold whitespace-nowrap">
                        تم السداد بنجاح ✓
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-bold whitespace-nowrap">
                        معلق / مطلوب السداد
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block mb-0.5">المبلغ:</span>
                    <span className="font-latin font-bold text-amber-300 whitespace-nowrap">{p.amount} ج.م</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block mb-0.5">تاريخ السداد:</span>
                    <span className="font-latin font-semibold text-slate-300 whitespace-nowrap">{p.paymentDate || '—'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block mb-0.5">رقم الإيصال:</span>
                    <span className="font-latin font-semibold text-blue-300 whitespace-nowrap">{p.receiptNumber || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material Document & PDF Preview Modal for Parents */}
      {previewMaterial && (
        <MaterialPreviewModal
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          onSendToast={onSendNotificationToast}
        />
      )}

      {/* Modal: Confirm Unlink Student from Dashboard */}
      {showUnlinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-700/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">إلغاء متابعة الطالب</h3>
                <span className="text-xs text-slate-400 font-latin">{student.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              هل أنت متأكد من رغبتك في إيقاف متابعة الطالب <strong className="text-white font-bold">{student.fullName}</strong>؟
              <br />
              <span className="text-slate-400 block mt-1.5">
                • في حال توقف الطالب عن حضور الدرس، يمكنك إزالته من حسابك لإيقاف إشعاراته وتقاريره.
                <br />
                • يمكنك إعادة ربطه في أي وقت مستقبلاً بكود الطالب والاسم إذا عاد للدرس.
              </span>
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={unlinkLoading}
                onClick={handleConfirmUnlinkFromDashboard}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <UserMinus className="w-4 h-4" />
                <span>{unlinkLoading ? 'جاري الإلغاء...' : 'تأكيد إيقاف المتابعة'}</span>
              </button>
              <button
                type="button"
                disabled={unlinkLoading}
                onClick={() => setShowUnlinkModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-colors"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
