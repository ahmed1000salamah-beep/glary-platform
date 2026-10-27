import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { apiService } from '../../services/api';

interface Props {
  role: 'teacher' | 'secretary';
  onAuthenticated: () => void;
  onGoHome?: () => void;
}

export const StaffAuthGate: React.FC<Props> = ({ role, onAuthenticated, onGoHome }) => {
  const isTeacher = role === 'teacher';
  
  // View mode: 'login' | 'forgot_password' | 'reset_success'
  const [viewMode, setViewMode] = useState<'login' | 'forgot_password' | 'reset_success'>('login');

  // Login form state
  const [username, setUsername] = useState(() => (isTeacher ? 'ahmed' : 'secretary'));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password form state
  const [recoveryUsername, setRecoveryUsername] = useState(() => (!isTeacher ? 'secretary' : ''));
  const [securityKey, setSecurityKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Handle Login submission via Backend Server API
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const effectiveUsername = username.trim() || (!isTeacher ? 'secretary' : 'ahmed');

    if (!password.trim()) {
      setLoginError('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Authenticate with secure Backend Server (bcrypt + JWT)
      const res = await apiService.login(role, effectiveUsername, password.trim());

      if (res.success) {
        sessionStorage.setItem('glary_staff_auth', role);
        localStorage.setItem('glary_staff_auth', role);
        localStorage.setItem('glary_remembered_staff_role', role);
        onAuthenticated();
        return;
      }

      // 2. Fallback check for resilience
      const localValid = isTeacher
        ? storageService.verifyTeacherLogin(effectiveUsername, password)
        : storageService.verifySecretaryLogin(effectiveUsername, password);

      if (localValid) {
        sessionStorage.setItem('glary_staff_auth', role);
        localStorage.setItem('glary_staff_auth', role);
        localStorage.setItem('glary_remembered_staff_role', role);
        onAuthenticated();
      } else {
        setLoginError(res.message || 'بيانات الدخول غير صحيحة! يرجى التحقق من اسم المستخدم وكلمة المرور.');
      }
    } catch {
      setLoginError('حدث خطأ أثناء محاولة تسجيل الدخول، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Reset submission via Backend Server API
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!recoveryUsername.trim() || !securityKey.trim()) {
      setRecoveryError('يرجى إدخال اسم المستخدم ورمز الأمان الخاص بالحساب.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setRecoveryError('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (newPassword.length < 4) {
      setRecoveryError('يجب ألا تقل كلمة المرور عن 4 أحرف أو أرقام.');
      return;
    }

    setIsResetting(true);
    try {
      // Execute server-side password reset & bcrypt re-hashing
      const result = await apiService.resetPassword(role, recoveryUsername.trim(), securityKey.trim(), newPassword.trim());

      if (result.success) {
        // Also update local fallback
        if (isTeacher) {
          storageService.resetTeacherPassword(securityKey, newPassword);
        } else {
          storageService.resetSecretaryPassword(securityKey, newPassword);
        }
        setRecoverySuccessMsg(result.message);
        setViewMode('reset_success');
        setPassword('');
        setUsername(recoveryUsername);
      } else {
        setRecoveryError(result.message);
      }
    } catch {
      setRecoveryError('فشل الاتصال بالسيرفر لإعادة تعيين كلمة المرور.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-cairo" dir="rtl">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 ${
          isTeacher ? 'bg-amber-500' : 'bg-indigo-600'
        }`} />
      </div>

      <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Top Header */}
        <div className="text-center mb-6">
          <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-3.5 transition-transform hover:scale-105 ${
            isTeacher 
              ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-amber-500/20' 
              : 'bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-indigo-500/20'
          }`}>
            <ShieldCheck className="w-7 h-7" />
          </div>

          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 border ${
            isTeacher 
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
          }`}>
            {isTeacher ? 'بوابة المعلم المستقلة' : 'بوابة السكرتارية والمشرفين'}
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-white">
            {isTeacher ? 'تسجيل دخول مستر أحمد المعاطي' : 'تسجيل دخول الإدارة والسكرتارية'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isTeacher 
              ? 'يرجى إدخال اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم والإدارة الأكاديمية' 
              : 'يرجى إدخال بيانات الدخول لإدارة الحضور، الغياب، الأكواد، ومتابعة الطلاب'}
          </p>
        </div>

        {/* View Mode 1: Standard Login */}
        {viewMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم المستخدم (Username):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isTeacher ? 'أدخل اسم المستخدم (مثال: ahmed)' : 'أدخل اسم المستخدم (مثال: secretary)'}
                  required
                  autoFocus
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-latin pl-10"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  كلمة المرور (Password):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot_password');
                    setRecoveryUsername(username);
                    setRecoveryError('');
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-latin pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                <span>
                  💡 كلمة المرور: <span className="font-mono text-amber-300 font-latin">{isTeacher ? '252525' : '141414'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(isTeacher ? '252525' : '141414');
                  }}
                  className={`text-[10px] underline font-semibold ${isTeacher ? 'text-amber-400 hover:text-amber-300' : 'text-indigo-400 hover:text-indigo-300'}`}
                >
                  تعبئة الرمز تلقائياً
                </button>
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              } ${
                isTeacher 
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'جارٍ التحقق المشفر في السيرفر...' : 'تسجيل الدخول إلى النظام'}</span>
            </button>
          </form>
        )}

        {/* View Mode 2: Forgot Password Recovery */}
        {viewMode === 'forgot_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-blue-300 text-xs flex items-start gap-2 leading-relaxed">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                نظام استرجاع آمن: أدخل اسم المستخدم ورمز الأمان الخاص بحسابك (PIN) لتعيين كلمة مرور جديدة فوراً.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم المستخدم:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recoveryUsername}
                  onChange={(e) => setRecoveryUsername(e.target.value)}
                  placeholder="اسم المستخدم"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-latin pl-10"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رمز أمان الحساب للطوارئ (Master Security PIN):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  placeholder="أدخل رمز الأمان المكون من 6 أرقام"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-latin pl-10"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                الرمز الافتراضي المبرمج لحسابك: {isTeacher ? '202600' : '102030'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كلمة المرور الجديدة:
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-latin pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3.5 top-3 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تأكيد كلمة المرور الجديدة:
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 font-latin"
              />
            </div>

            {recoveryError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{recoveryError}</span>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>حفظ كلمة المرور الجديدة والدخول</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('login')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                العودة لصفحة تسجيل الدخول
              </button>
            </div>
          </form>
        )}

        {/* View Mode 3: Reset Success */}
        {viewMode === 'reset_success' && (
          <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">تم تغيير كلمة المرور بنجاح!</h3>
            <p className="text-xs text-slate-300">{recoverySuccessMsg}</p>
            <button
              onClick={() => setViewMode('login')}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
            >
              تسجيل الدخول الآن بكلمة المرور الجديدة
            </button>
          </div>
        )}

        {/* Optional Go Home */}
        {onGoHome && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى بوابة الطلاب الرئيسية</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
