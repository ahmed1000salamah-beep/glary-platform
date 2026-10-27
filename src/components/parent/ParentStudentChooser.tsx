import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  ChevronLeft, 
  Award, 
  Calendar, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  UserMinus
} from 'lucide-react';
import { Student, ParentAccount } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  parent: ParentAccount;
  students: Student[];
  onSelectStudent: (student: Student) => void;
  onRefreshParent: () => void;
}

export const ParentStudentChooser: React.FC<Props> = ({
  parent,
  students,
  onSelectStudent,
  onRefreshParent,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [studentToUnlink, setStudentToUnlink] = useState<Student | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirmUnlink = () => {
    if (!studentToUnlink) return;
    setUnlinkLoading(true);
    storageService.unlinkStudentFromParent(parent.id, studentToUnlink.code);
    onRefreshParent();
    setUnlinkLoading(false);
    setStudentToUnlink(null);
  };

  const handleLinkStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setLoading(true);

    setTimeout(() => {
      const res = storageService.linkAdditionalStudentToParent(parent.id, newCode, newName);
      setLoading(false);

      if (!res.success) {
        setAddError(res.error || 'تعذر ربط الطالب.');
      } else {
        setAddSuccess('تم ربط الطالب بنجاح!');
        setNewCode('');
        setNewName('');
        onRefreshParent();
        setTimeout(() => {
          setShowAddModal(false);
          setAddSuccess(null);
        }, 1200);
      }
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border border-blue-700/40 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مرحباً بك: {parent.fullName} ({parent.type === 'father' ? 'الأب' : 'الأم'})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              اختر الطالب للمتابعة الدقيقة
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              لديك <strong className="text-blue-300">{students.length} طلاب مسجلين</strong> في مجموعات مستر أحمد المعاطي. اختر الطالب لعرض كافة تفاصيل درجاته، غيابه، ومستواه التراكمي.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm border border-blue-400/40 transition-all shadow-md self-start sm:self-center shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ربط ابن/طالب إضافي</span>
          </button>
        </div>
      </div>

      {/* Grid of Children Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {students.map((student) => {
          // Calculate stats
          const totalExams = student.exams.length;
          const avgScore = totalExams > 0
            ? Math.round(
                student.exams.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 100, 0) / totalExams
              )
            : 0;

          const totalAttendance = student.attendance.length;
          const presentCount = student.attendance.filter(a => a.status === 'present').length;
          const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;
          const latestExam = student.exams[0];

          return (
            <div
              key={student.id}
              onClick={() => onSelectStudent(student)}
              className="group bg-slate-900/90 border-2 border-slate-700/80 hover:border-blue-500 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/40 font-latin">
                        {student.code}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors mt-0.5">
                        {student.fullName}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {student.gradeLevel}
                      </p>
                    </div>
                  </div>

                  {/* Button to remove/unlink student if lessons stopped */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudentToUnlink(student);
                    }}
                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 p-2 rounded-xl border border-slate-700/60 hover:border-rose-700/50 transition-all text-xs font-bold flex items-center gap-1.5 shrink-0"
                    title="إلغاء متابعة الطالب (في حال توقف عن الدرس)"
                  >
                    <UserMinus className="w-4 h-4 text-rose-400" />
                    <span className="hidden sm:inline text-rose-300 text-[11px]">إلغاء المتابعة</span>
                  </button>
                </div>

                {/* Group details */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 mb-4 text-xs text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{student.groupName}</span>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">متوسط درجات الامتحانات</span>
                    <span className={`text-base font-extrabold font-latin ${avgScore >= 85 ? 'text-emerald-400' : avgScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {avgScore}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
                    <span className="text-[11px] text-slate-400 block mb-0.5">نسبة الانضباط والحضور</span>
                    <span className="text-base font-extrabold text-blue-400 font-latin">
                      {attendanceRate}%
                    </span>
                  </div>
                </div>

                {/* Latest Exam Preview */}
                {latestExam && (
                  <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs">
                    <div className="flex items-center justify-between text-slate-300 mb-1">
                      <span className="font-semibold text-white truncate max-w-[190px]">{latestExam.title}</span>
                      <span className="font-bold text-amber-300 font-latin shrink-0">{latestExam.score} / {latestExam.maxScore}</span>
                    </div>
                    {latestExam.feedback && (
                      <p className="text-[11px] text-blue-200 line-clamp-1 italic">
                        "{latestExam.feedback}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
                <span>فتح صفحة المتابعة الكاملة</span>
                <span className="flex items-center gap-1 font-latin group-hover:-translate-x-1 transition-transform">
                  عرض التفاصيل ←
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Link Additional Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">ربط طالب إضافي بحساب ولي الأمر</h3>
            <p className="text-xs text-slate-400 mb-4">
              أدخل كود واسم الابن/الابنة كما هو مسجل في المنصة ليتم إضافته إلى حسابك
            </p>

            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  كود الطالب:
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="مثال: STD-103"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 uppercase font-mono font-latin focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم الطالب ثلاثي:
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: يوسف أحمد المنشاوي"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {addError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{addSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
                >
                  {loading ? 'جاري التحقق...' : 'تأكيد الربط'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Unlink Student */}
      {studentToUnlink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-3xl p-6 text-slate-100 shadow-2xl relative">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/80 border border-rose-700/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">إلغاء متابعة الطالب</h3>
                <span className="text-xs text-slate-400 font-latin">{studentToUnlink.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              هل أنت متأكد من رغبتك في إلغاء متابعة الطالب <strong className="text-white font-bold">{studentToUnlink.fullName}</strong>؟
              <br />
              <span className="text-slate-400 block mt-1.5">
                • إذا توقف الطالب عن حضور الدرس، يمكنك إزالته من حسابك لإبقاء لوحتك منظمة.
                <br />
                • يمكنك إعادة ربطه في أي وقت مستقبلاً باستخدام كود الطالب والاسم إذا عاد للدرس.
              </span>
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={unlinkLoading}
                onClick={handleConfirmUnlink}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <UserMinus className="w-4 h-4" />
                <span>{unlinkLoading ? 'جاري الإلغاء...' : 'تأكيد إيقاف المتابعة'}</span>
              </button>
              <button
                type="button"
                disabled={unlinkLoading}
                onClick={() => setStudentToUnlink(null)}
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
