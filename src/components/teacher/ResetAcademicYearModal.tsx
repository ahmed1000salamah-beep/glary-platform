import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  RefreshCw 
} from 'lucide-react';
import { storageService } from '../../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetAcademicYearModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetType, setResetType] = useState<'all' | 'mocks_only'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Verify Teacher Password
    const isValid = storageService.verifyTeacherPassword(password);
    if (!isValid) {
      setError('كلمة مرور المعلم غير صحيحة! لا يمكن تنفيذ هذا الإجراء إلا بكلمة مرور المعلم الصحيحة.');
      return;
    }

    setIsProcessing(true);

    try {
      if (resetType === 'mocks_only') {
        storageService.deleteMockStudents();
      } else {
        // 2. Perform the full academic year data reset (including mock students)
        storageService.resetAcademicYearData();
      }
      
      setIsProcessing(false);
      setPassword('');
      onSuccess();
      onClose();
    } catch (err) {
      setIsProcessing(false);
      setError('حدث خطأ غير متوقع أثناء حذف البيانات. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 relative text-slate-100 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>حذف بيانات السنة الدراسية</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-[10px] font-bold text-rose-300">
                حساس جداً
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تصفير بيانات الطلاب والكويزات لبدء عام دراسي جديد
            </p>
          </div>
        </div>

        {/* Selection between Full Reset or Only 500 Mock Students */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-bold text-slate-300">نطاق الحذف المطلوب:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setResetType('all')}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                resetType === 'all'
                  ? 'bg-rose-950/70 border-rose-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">حذف جميع بيانات السنة</span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${resetType === 'all' ? 'border-rose-400 bg-rose-500' : 'border-slate-600'}`}>
                  {resetType === 'all' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <span className="text-[10px] opacity-75">
                تصفير كامل للطلاب (الحقيقيين والـ 500 وهمي) والكويزات
              </span>
            </button>

            <button
              type="button"
              onClick={() => setResetType('mocks_only')}
              className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                resetType === 'mocks_only'
                  ? 'bg-amber-950/70 border-amber-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">حذف الـ 500 طالب وهمي فقط</span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${resetType === 'mocks_only' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'}`}>
                  {resetType === 'mocks_only' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </div>
              <span className="text-[10px] opacity-75">
                إزالة الطلاب التجريبيين مع الإبقاء على الطلاب المسجلين
              </span>
            </button>
          </div>
        </div>

        {/* Informational Warning Box */}
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-4 mb-5 text-xs text-slate-300 space-y-2 leading-relaxed">
          <div className="flex items-start gap-2 text-rose-300 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>ما الذي سيحدث عند تأكيد الحذف؟</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] pr-2">
            {resetType === 'all' ? (
              <>
                <li><strong className="text-rose-300">سيتم حذف:</strong> جميع بيانات الطلاب (الـ 500 طالب وهمي والطلاب الآخرين)، حسابات أولياء الأمور، الحضور والغياب، الكويزات وسجلات الدفع.</li>
                <li><strong className="text-emerald-300">محفوظ بأمان:</strong> حساب المعلم، حساب السكرتارية، كلمات المرور، اسم المنصة وصورة المستر.</li>
              </>
            ) : (
              <>
                <li><strong className="text-amber-300">سيتم حذف:</strong> الطلاب الوهميون المولدون للاختبار (500 طالب) وسجلاتهم بالكامل.</li>
                <li><strong className="text-emerald-300">محفوظ بأمان:</strong> الطلاب الحقيقيون، حسابات أولياء الأمور، وإعدادات المنصة.</li>
              </>
            )}
          </ul>
        </div>

        {/* Password Verification Form */}
        <form onSubmit={handleConfirmReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>أدخل كلمة مرور المعلم لتأكيد الإجراء:</span>
              </span>
              <span className="text-[10px] text-slate-400">مطلوب للتحقق من هوية المستر</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="أدخل كلمة مرور صفحة المعلم..."
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-latin font-bold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all text-center tracking-wider"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              إلغاء التراجع
            </button>
            
            <button
              type="submit"
              disabled={isProcessing || !password.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري حذف بيانات السنة...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>تأكيد الحذف وبدء سنة جديدة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
