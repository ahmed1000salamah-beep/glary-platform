import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  HardDrive, 
  Download, 
  ExternalLink,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { Student } from '../../types';
import { storageService } from '../../services/storage';
import { downloadTeacherUSBLauncher } from './FlashLauncherGenerator';
import { TeacherDashboard } from './TeacherDashboard';

interface Props {
  onExitToMainSite: () => void;
  onSendNotificationToast: (title: string, body: string) => void;
}

export const TeacherStandaloneApp: React.FC<Props> = ({
  onExitToMainSite,
  onSendNotificationToast
}) => {
  // Security Lock State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check session storage if already authenticated during this tab session
    return sessionStorage.getItem('glary_teacher_usb_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [students, setStudents] = useState<Student[]>([]);

  // Load students
  const loadStudents = () => {
    const list = storageService.getStudents();
    setStudents(list);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Handle PIN verification
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const isValid = storageService.verifyTeacherPassword(pinInput);
    if (isValid) {
      setIsAuthenticated(true);
      sessionStorage.setItem('glary_teacher_usb_auth', 'true');
      setPinInput('');
      onSendNotificationToast(
        'تم تأكيد الهوية بنجاح 🔒',
        'مرحباً بك يا مستر أحمد المعاطي في تطبيق المعلم المستقل.'
      );
    } else {
      setAuthError('رمز المرور غير صحيح! يرجى إدخال كلمة مرور المعلم الصحيحة.');
    }
  };

  // Lock session
  const handleLockSession = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('glary_teacher_usb_auth');
    onSendNotificationToast('تم قفل التطبيق 🔒', 'تم قفل التطبيق بنجاح لحماية سرية البيانات.');
  };

  // If not authenticated, show High-Security Lockscreen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-cairo">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-blue-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-700 to-indigo-600 border border-blue-400/40 mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-900/40">
            <HardDrive className="w-10 h-10" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>تطبيق المعلم المستقل المحمول</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              بوابة المعلم المحمية
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              هذه الواجهة مخصصة حصرياً للأستاذ <strong className="text-slate-200">أحمد المعاطي</strong>. يُرجى تأكيد كلمة المرور للوصول إلى إدارة الدرجات والطلاب.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>كلمة مرور المعلم:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-latin">Teacher Password</span>
              </label>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="أدخل كلمة مرور المعلم..."
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-sm font-latin font-bold focus:outline-none focus:border-blue-500 text-center tracking-widest"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>دخول تطبيق المعلم المستقل</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onExitToMainSite}
              className="text-slate-400 hover:text-white transition-all flex items-center gap-1"
            >
              <span>← العودة للمنصة العامة</span>
            </button>

            <button
              type="button"
              onClick={() => downloadTeacherUSBLauncher()}
              className="text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1 font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل مشغل الفلاشة USB</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Main UI
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-cairo">
      {/* 1. Standalone Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-blue-500/20 backdrop-blur-md px-4 sm:px-6 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo & Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white shadow-md">
              <HardDrive className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">
                  تطبيق المعلم المستقل المحمول
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  متصل لحظياً
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                مستر أحمد المعاطي • {students.length} طالب مسجل بالمنصة
              </p>
            </div>
          </div>

          {/* Quick Actions (USB Download, Lock, Exit) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* USB Launcher Download */}
            <button
              type="button"
              onClick={() => downloadTeacherUSBLauncher()}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
              title="تنزيل ملف التشغيل السريع المخصص للحفظ على الفلاش ميموري (USB)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحميل للفلاشة USB</span>
              <span className="sm:hidden">فلاشة USB</span>
            </button>

            {/* Lock Session */}
            <button
              type="button"
              onClick={handleLockSession}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-all border border-slate-700"
              title="قفل الشاشة فوراً للحماية"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            {/* Exit to Main Site */}
            <button
              type="button"
              onClick={onExitToMainSite}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1 border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>المنصة الرئيسية</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Body: Direct Full Teacher Dashboard with its original tabs */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <TeacherDashboard
          role="teacher"
          onBackToRoles={onExitToMainSite}
          onSendNotificationToast={onSendNotificationToast}
        />
      </main>
    </div>
  );
};
