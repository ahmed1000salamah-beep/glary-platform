import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  BookOpen, 
  MapPin, 
  GraduationCap,
  Copy,
  Check,
  Send
} from 'lucide-react';
import { Student } from '../../types';

interface Props {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent?: (student: Student) => void;
  monthlyFee?: number;
}

export const StudentFullProfileModal: React.FC<Props> = ({
  student,
  isOpen,
  onClose,
  monthlyFee = 350
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grades' | 'payments'>('overview');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !student) return null;

  const handleCopyCode = () => {
    const code = student.nfcCardCode || student.code;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone.replace(/^0+/, '')}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Calculations
  const attendanceList = student.attendance || [];
  const presentCount = attendanceList.filter(a => a.status === 'present').length;
  const homeworkCompleteCount = attendanceList.filter(a => a.homeworkStatus === 'completed').length;
  const exams = student.exams || [];
  const avgExamScore = exams.length > 0 
    ? Math.round((exams.reduce((sum, e) => sum + (e.score / (e.maxScore || 50)) * 100, 0) / exams.length))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-cairo" dir="rtl">
      <div className="w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30 shrink-0">
              {student.fullName ? student.fullName.trim()[0] : 'ط'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">{student.fullName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {student.gradeLevel || 'المرحلة الثانوية'}
                </span>
                {student.branch && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                    student.branch === 'كفر سعد' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    <MapPin className="w-3 h-3" />
                    <span>{student.branch}</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>كارت NFC: {student.nfcCardCode || student.code}</span>
                  <button 
                    onClick={handleCopyCode} 
                    className="hover:text-white mr-1 transition-colors"
                    title="نسخ كود الكارت"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </span>
                <span>المجموعة: <strong className="text-slate-200">{student.groupName || 'غير محددة'}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Contact Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {student.phone && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">هاتف الطالب:</span>
                <span className="font-mono text-slate-200">{student.phone}</span>
                <button
                  onClick={() => openWhatsApp(student.phone, `السلام عليكم يا ${student.fullName}، بخصوص متابعتك في حصص اللغة الإنجليزية مع مستر أحمد المعاطي.`)}
                  className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>واتساب الطالب</span>
                </button>
              </div>
            )}

            {student.parentPhone && (
              <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
                <span className="text-slate-400">هاتف ولي الأمر:</span>
                <span className="font-mono text-slate-200">{student.parentPhone}</span>
                <button
                  onClick={() => openWhatsApp(student.parentPhone!, `السلام عليكم ورحمة الله، تقرير متابعة الطالب ${student.fullName} مع مستر أحمد المعاطي.`)}
                  className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>واتساب ولي الأمر</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">كود المنصة:</span>
            <span className="font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded font-bold border border-amber-500/20">
              {student.code}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>نظرة عامة والبيانات</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>سجل الحضور والواجبات ({attendanceList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('grades')}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'grades'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>الاختبارات والتسميع ({exams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 px-3 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>المصروفات والاشتراك</span>
          </button>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
                  <span className="block text-2xl font-black text-indigo-400">{presentCount}</span>
                  <span className="text-xs text-slate-400">مرات الحضور</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
                  <span className="block text-2xl font-black text-emerald-400">{homeworkCompleteCount}</span>
                  <span className="text-xs text-slate-400">واجب مكتمل</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
                  <span className="block text-2xl font-black text-amber-400">{avgExamScore}%</span>
                  <span className="text-xs text-slate-400">متوسط الامتحانات</span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
                  <span className="block text-2xl font-black text-cyan-400">{monthlyFee} ج.م</span>
                  <span className="text-xs text-slate-400">سعر الشهر</span>
                </div>
              </div>

              {/* Full Details Grid */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>معلومات الحساب والاشتراك بالمجموعة</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400">اسم الطالب:</span>
                    <strong className="text-white font-bold">{student.fullName}</strong>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400">المرحلة الدراسية:</span>
                    <strong className="text-white font-bold">{student.gradeLevel}</strong>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400">المقر:</span>
                    <strong className="text-cyan-400 font-bold">{student.branch || 'دمياط'}</strong>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400">المجموعة:</span>
                    <strong className="text-indigo-300 font-bold">{student.groupName}</strong>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400">كود كارت NFC للدخول:</span>
                    <strong className="text-amber-300 font-mono font-bold">{student.nfcCardCode || student.code}</strong>
                  </div>

                  <div className="flex justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                    <span className="text-slate-400">كود المنصة الإلكترونية:</span>
                    <strong className="text-emerald-400 font-mono font-bold">{student.code}</strong>
                  </div>
                </div>
              </div>

              {/* Teacher Notes */}
              {student.notes && student.notes.length > 0 && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>ملاحظات المعلم والتوجيهات الأكاديمية</span>
                  </h4>
                  <div className="space-y-2">
                    {student.notes.map((n, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-start gap-2.5">
                        <span className="text-amber-400 font-bold">●</span>
                        <div className="flex-1">
                          <p className="text-slate-200">{n.content}</p>
                          <span className="text-[10px] text-slate-500 font-latin mt-1 block">{n.date} - {n.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ATTENDANCE & HOMEWORK */}
          {activeTab === 'attendance' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>سجل الحصص والأوقات المرصودة بواسطة كارت NFC والحضور اليدوي</span>
                <span>إجمالي الحصص: {attendanceList.length}</span>
              </div>

              {attendanceList.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">لا توجد حصص مسجلة لهذا الطالب حتى الآن.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {attendanceList.map((att, idx) => (
                    <div 
                      key={att.id || idx}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          att.status === 'present' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {att.status === 'present' ? 'حاضر' : 'غياب'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-white text-sm">{att.lectureTitle || 'حصة اللغة الإنجليزية'}</strong>
                            <span className="text-xs text-slate-400 font-latin">{att.date}</span>
                          </div>
                          {att.entryTime && (
                            <span className="text-xs text-indigo-400 font-latin flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>حضر الساعة: {att.entryTime}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Homework Badge */}
                        <span className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 ${
                          att.homeworkStatus === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : att.homeworkStatus === 'incomplete'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {att.homeworkStatus === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {att.homeworkStatus === 'incomplete' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {att.homeworkStatus === 'not_submitted' && <XCircle className="w-3.5 h-3.5" />}
                          <span>
                            {att.homeworkStatus === 'completed' ? 'الواجب كامل' : att.homeworkStatus === 'incomplete' ? 'الواجب ناقص' : 'لم يحل الواجب'}
                          </span>
                        </span>

                        {/* Vocab / Recitation Score */}
                        {att.vocabScore !== undefined && (
                          <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold font-latin">
                            تسميع: {att.vocabScore} / {att.vocabMaxScore || 10}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GRADES & EXAMS */}
          {activeTab === 'grades' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>سجل الاختبارات والكويزات الشاملة والدورية</span>
                <span>إجمالي الاختبارات: {exams.length}</span>
              </div>

              {exams.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl">
                  <Award className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">لا توجد اختبارات مسجلة لهذا الطالب حتى الآن.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {exams.map((exam, idx) => {
                    const percentage = Math.round((exam.score / (exam.maxScore || 50)) * 100);
                    return (
                      <div 
                        key={exam.id || idx}
                        className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <h5 className="font-bold text-white text-sm">{exam.title}</h5>
                          <span className="text-xs text-slate-400 font-latin">{exam.date}</span>
                          {exam.feedback && (
                            <p className="text-xs text-slate-300 mt-1">{exam.feedback}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-left font-mono">
                            <span className="text-base font-black text-indigo-400">{exam.score}</span>
                            <span className="text-xs text-slate-500"> / {exam.maxScore}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${
                            percentage >= 85 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : percentage >= 65
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS & SUBSCRIPTIONS */}
          {activeTab === 'payments' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-900/40 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">سعر الاشتراك الشهري للمجموعة</h4>
                  <p className="text-xs text-slate-400 mt-0.5">محدد مسبقاً لمجموعة {student.groupName || 'العامة'}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono">{monthlyFee}</span>
                  <span className="text-xs text-slate-400 mr-1">جنيه مصري</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block text-sm">اشتراك شهر أكتوبر 2026</strong>
                    <span className="text-slate-400 font-latin">تم السداد بواسطة كارت المنصة</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    تم السداد ✅
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block text-sm">اشتراك شهر نوفمبر 2026</strong>
                    <span className="text-slate-400 font-latin">استحقاق أول الشهر</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    مستحق قريباً ⏳
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            ID: {student.id}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            إغلاق السجل
          </button>
        </div>

      </div>
    </div>
  );
};
