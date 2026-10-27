import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Phone, 
  User, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { ParentAccount, ParentType } from '../../types';
import { storageService } from '../../services/storage';
import { PortalRole } from '../../services/portalLinks';

interface Props {
  onSuccess: (parent: ParentAccount) => void;
  onBackToRoles: () => void;
  onOpenPWAInstall?: (targetRole?: PortalRole) => void;
  onSendNotificationToast?: (title: string, body: string) => void;
}

export const ParentAuth: React.FC<Props> = ({ onSuccess, onBackToRoles, onOpenPWAInstall, onSendNotificationToast }) => {
  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [parentType, setParentType] = useState<ParentType>('father');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login specific
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Remembered parent on this device
  const [rememberedParentPhone, setRememberedParentPhone] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('glary_remembered_parent_phone');
  });
  const [rememberedParentName, setRememberedParentName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('glary_remembered_parent_name');
  });
  const [isQuickUnlockMode, setIsQuickUnlockMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('glary_remembered_parent_phone'));
  });

  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle Parent Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic Validations
    if (!fullName.trim() || !phone.trim() || !studentCode.trim() || !studentName.trim() || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة للمتابعة.');
      return;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام لضمان أمان الحساب.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين! يرجى إعادة التأكيد بدقة.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Register with storage service (validates student, 1 father & 1 mother constraint, and phone uniqueness)
      const res = storageService.registerParent({
        type: parentType,
        fullName,
        phone,
        email,
        password,
        studentCode,
        studentName,
      });

      setLoading(false);

      if (!res.success || !res.parent) {
        setError(res.error || 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة لاحقاً.');
      } else {
        localStorage.setItem('glary_remembered_parent_phone', res.parent.phone);
        localStorage.setItem('glary_remembered_parent_name', res.parent.fullName);
        setRememberedParentPhone(res.parent.phone);
        setRememberedParentName(res.parent.fullName);
        setSuccessMsg('تم تسجيل حساب ولي الأمر وربطه بالطالب بنجاح! جاري تحويلك...');
        setTimeout(() => {
          onSuccess(res.parent!);
        }, 800);
      }
    }, 400);
  };

  // Handle Parent Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = isQuickUnlockMode && rememberedParentPhone ? rememberedParentPhone : loginPhoneOrEmail;

    if (!identifier.trim() || !loginPassword) {
      setError('يرجى إدخال كلمة المرور للمتابعة.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const res = storageService.loginParent(identifier, loginPassword);
      setLoading(false);

      if (!res.success || !res.parent) {
        setError(res.error || 'فشل تسجيل الدخول. كلمة المرور غير صحيحة.');
      } else {
        localStorage.setItem('glary_remembered_parent_phone', res.parent.phone);
        localStorage.setItem('glary_remembered_parent_name', res.parent.fullName);
        setRememberedParentPhone(res.parent.phone);
        setRememberedParentName(res.parent.fullName);
        onSuccess(res.parent!);
      }
    }, 350);
  };

  // Google Sign-In simulated flow
  const handleGoogleSignIn = () => {
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Let user either sign in with existing Google linked account or register quickly
      const parents = storageService.getParents();
      const existingKhaled = parents.find(p => p.id === 'p-1');
      if (existingKhaled) {
        onSuccess(existingKhaled);
      } else {
        setError('يرجى إكمال بيانات تسجيل ولي الأمر لربط حساب Google.');
      }
    }, 500);
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 relative">
        {/* Top Action Row: Back button */}
        <div className="flex items-center justify-between gap-2 mb-6 pb-2 border-b border-slate-800 flex-wrap">
          <button
            onClick={onBackToRoles}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white group transition-colors"
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span>الرجوع لاختيار نوع الحساب</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              بوابة ولي الأمر
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              متابعة مستوى الأبناء في اللغة الإنجليزية
            </h1>
            <p className="text-xs text-slate-400">
              مع الأستاذ أحمد المعاطي - تقارير دقيقة ومستمرة
            </p>
          </div>
        </div>

        {/* Mode Tabs: Login vs Register */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-800/80 rounded-2xl mb-6 border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تسجيل دخول ولي الأمر
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            تسجيل حساب جديد لولي الأمر
          </button>
        </div>

        {/* ======================= LOGIN FORM ======================= */}
        {mode === 'login' ? (
          <div>
            {isQuickUnlockMode && rememberedParentPhone && rememberedParentName ? (
              <div className="mb-5 p-4 rounded-2xl bg-blue-950/40 border border-blue-800/50 text-center">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                  حساب ولي أمر محفوظ ✓
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  أهلاً بك أ. {rememberedParentName}
                </h3>
                <p className="text-xs text-slate-400 font-latin mt-0.5">
                  الهاتف: {rememberedParentPhone}
                </p>
                <p className="text-xs text-blue-300 mt-1 font-medium">
                  أدخل كلمة المرور فقط للدخول السريع
                </p>
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off" autoCapitalize="off">
              {/* Decoy inputs to block browser credential autofill popups */}
              <input type="text" name="decoy_parent_user" className="hidden" tabIndex={-1} autoComplete="off" />
              <input type="password" name="decoy_parent_pass" className="hidden" tabIndex={-1} autoComplete="off" />

              {(!isQuickUnlockMode || !rememberedParentPhone) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رقم هاتف ولي الأمر أو البريد الإلكتروني:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="custom_parent_identifier"
                      id="custom_parent_identifier"
                      value={loginPhoneOrEmail}
                      onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                      placeholder="اكتب رقم الهاتف هنا..."
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-latin"
                    />
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  باسورد ولي الأمر (Parent Password):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="custom_parent_pass"
                    id="custom_parent_pass"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="اكتب كلمة المرور..."
                    required
                    autoFocus={isQuickUnlockMode}
                    autoComplete="new-password"
                    data-lpignore="true"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-latin"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-start gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>جاري التحقق من الحساب...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>دخول إلى لوحة متابعة الطالب</span>
                  </>
                )}
              </button>

              {isQuickUnlockMode && rememberedParentPhone && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickUnlockMode(false);
                      setError(null);
                      setLoginPassword('');
                    }}
                    className="text-xs text-slate-400 hover:text-blue-400 transition-colors underline"
                  >
                    تسجيل دخول برقم هاتف آخر أو حساب مختلف
                  </button>
                </div>
              )}
            </form>
          </div>
        ) : (
          /* ======================= REGISTRATION FORM ======================= */
          <form onSubmit={handleRegister} className="space-y-4" autoComplete="off" autoCapitalize="off">
            <input type="text" name="decoy_reg_user" className="hidden" tabIndex={-1} autoComplete="off" />
            <input type="password" name="decoy_reg_pass" className="hidden" tabIndex={-1} autoComplete="off" />
            {/* Question 1: Father or Mother */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-2">
                1. هل أنت: أب أم أم؟ (اختر صلة القرابة بالطالب)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setParentType('father')}
                  className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    parentType === 'father'
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md shadow-blue-900/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">👨</span>
                  <span>أنا الأب (Father)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParentType('mother')}
                  className={`p-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    parentType === 'mother'
                      ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-md shadow-rose-900/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">👩</span>
                  <span>أنا الأم (Mother)</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 inline" />
                <span>قاعدة المنصة: يسمح بتسجيل حساب أب واحد وأم واحدة فقط لكل طالب.</span>
              </p>
            </div>

            {/* Parent Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم ولي الأمر ثلاثي:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: خالد عبد العزيز محمود"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم الهاتف (واتساب للمتابعة):
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 01012345678"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-latin"
                />
              </div>
            </div>

            {/* Student Code and Name Verification */}
            <div className="p-3.5 rounded-2xl bg-slate-850 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>ربط الطالب بالكود والاسم (التحقق الأكاديمي):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    كود الطالب (المسجل بالسنتر):
                  </label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    placeholder="مثال: STD-103"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-mono tracking-wider font-latin"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    اسم الطالب كما هو مسجل بالمنصة:
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: يوسف أحمد المنشاوي"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                ⚠️ سيقوم النظام بالتحقق التلقائي من مطابقة الاسم للكود، وعدم وجود حساب سابق لنفس الصلة ({parentType === 'father' ? 'الأب' : 'الأم'}).
              </p>
            </div>

            {/* Password and Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  وضع كلمة المرور (Password):
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="لا تقل عن 6 خانات"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-latin"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تأكيد كلمة المرور:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-latin"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-600/50 flex items-start gap-2.5 text-rose-300 text-xs animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-600/50 flex items-start gap-2.5 text-emerald-300 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>جاري تسجيل الحساب والتحقق...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>تأكيد إنشاء الحساب والربط بالطالب</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
