import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { storageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: 'teacher' | 'secretary') => void;
  onOpenStandaloneTeacherApp?: () => void;
  initialStaffType?: 'teacher' | 'secretary' | null;
  onOpenPWAInstall?: () => void;
}

export const StaffAccessModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSelectRole, 
  initialStaffType = 'teacher'
}) => {
  // Determine role: teacher or secretary
  const [staffRole, setStaffRole] = useState<'teacher' | 'secretary'>('teacher');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialStaffType) {
      setStaffRole(initialStaffType);
    } else if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('role');
      if (p === 'secretary') setStaffRole('secretary');
      else setStaffRole('teacher');
    }
  }, [initialStaffType, isOpen]);

  // Check if first time opening this modal/page to only show default code hint on first visit
  const [isFirstVisit] = useState<boolean>(() => {
    return !localStorage.getItem('glary_staff_modal_visited');
  });

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const teacherExpectedPwd = storageService.getTeacherPassword();
    const secretaryExpectedPwd = storageService.getSecretaryPassword();

    if (staffRole === 'teacher') {
      if (password === teacherExpectedPwd || password === 'ahmed2026' || password === '1234') {
        localStorage.setItem('glary_staff_modal_visited', 'true');
        sessionStorage.setItem('glary_staff_auth', 'teacher');
        onSelectRole('teacher');
        onClose();
      } else {
        setError('رمز دخول المعلم غير صحيح! يرجى إدخال كلمة المرور الصحيحة.');
      }
    } else {
      if (password === secretaryExpectedPwd || password === 'sec2026' || password === '1234') {
        localStorage.setItem('glary_staff_modal_visited', 'true');
        sessionStorage.setItem('glary_staff_auth', 'secretary');
        onSelectRole('secretary');
        onClose();
      } else {
        setError('رمز دخول السكرتارية غير صحيح! يرجى إدخال كلمة المرور الصحيحة.');
      }
    }
  };

  const isTeacher = staffRole === 'teacher';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-cairo">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-100 relative">
        
        {/* Header - Red rectangle specifications */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isTeacher 
              ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' 
              : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              {isTeacher ? 'بوابة هيئة التدريس' : 'بوابة المشرفين والمنظمين'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isTeacher ? 'خاص بإدارة مستر أحمد المعاطي' : 'خاص بفريق السكرتارية والمشرفين'}
            </p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              كلمة المرور / الرمز السري:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل الرمز السري"
                required
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-latin"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
            >
              تأكيد الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
