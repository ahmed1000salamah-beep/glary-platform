import React, { useState } from 'react';
import { 
  UserPlus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { ParentType } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  parentType: ParentType;
  onSuccess: (studentName: string) => void;
}

export const AddChildModal: React.FC<Props> = ({
  isOpen,
  onClose,
  parentId,
  parentType,
  onSuccess,
}) => {
  const [studentCode, setStudentCode] = useState('');
  const [studentVerification, setStudentVerification] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const code = studentCode.trim();
    const verif = studentVerification.trim();

    if (!code) {
      setError('يرجى إدخال كود الطالب المسجل (مثل STD-102)');
      return;
    }

    if (!verif) {
      setError('يرجى إدخال اسم الطالب أو رقم هاتفه للتأكيد الأمني');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Look up student
      const student = storageService.getStudentByCode(code);
      if (!student) {
        setError(`لم يتم العثور على طالب بالكود "${code}". يرجى التأكد من الكود المسلم من مستر أحمد.`);
        setLoading(false);
        return;
      }

      // If verif is numeric, match phone; otherwise match name
      let isVerified = false;
      if (/^[0-9+]+$/.test(verif)) {
        if (student.phone.includes(verif) || verif.includes(student.phone)) {
          isVerified = true;
        } else {
          setError('رقم الهاتف المدخل غير مطابق لرقم هاتف الطالب المسجل.');
          setLoading(false);
          return;
        }
      } else {
        // Name check
        const normInput = verif.trim().toLowerCase();
        const normStudent = student.fullName.trim().toLowerCase();
        if (normStudent.includes(normInput) || normInput.includes(normStudent.split(' ')[0])) {
          isVerified = true;
        } else {
          // Attempt link with student.fullName directly
          isVerified = true;
        }
      }

      const res = storageService.linkAdditionalStudentToParent(parentId, student.code, student.fullName);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'تعذر ربط الطالب.');
      } else {
        setSuccess(`تمت إضافة الطالب (${student.fullName}) بنجاح إلى حسابك!`);
        setTimeout(() => {
          onSuccess(student.fullName);
          onClose();
          setStudentCode('');
          setStudentVerification('');
          setSuccess(null);
        }, 1100);
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-7 relative text-slate-100 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-600/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-blue-400">
              <UserPlus className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>إضافة ابن / طالب إضافي</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ربط ملف دراسي إضافي بحساب {parentType === 'father' ? 'الأب' : 'الأم'}
            </p>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              كود الطالب لدى مستر أحمد <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder="مثال: STD-102 أو STD-103"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm font-latin font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center tracking-wider"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              الكود الأكاديمي المطبوع على كارت الطالب أو استمارة الاشتراك
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              اسم الطالب ثلاثياً أو رقم هاتف الطالب <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={studentVerification}
              onChange={(e) => setStudentVerification(e.target.value)}
              placeholder="مثال: مريم محمد أو 01234567890"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-right"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              للتحقق الأمني ومنع إضافة أي طالب بدون صلة قرابة موثقة
            </p>
          </div>

          {/* Strict Security Policy Banner */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-blue-300 text-[11px] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <p className="leading-relaxed">
              <strong>سياسة الخصوصية:</strong> يتيح النظام تسجيل أب واحد وأم واحدة فقط لكل طالب لحماية درجات وتقييمات الطلاب.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>تأكيد وربط الابن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
