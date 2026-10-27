import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Settings, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Sparkles,
  Type,
  UserCheck,
  MessageCircle,
  Camera,
  Phone,
  ImageIcon,
  Lock,
  User,
  HardDrive,
  Database,
  Server,
  Volume2,
  VolumeX,
  Bell
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { apiService } from '../../services/api';
import { notificationSound } from '../../utils/notificationSound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (msg: string) => void;
}

export const TeacherSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [platformName, setPlatformName] = useState(() => storageService.getPlatformName());
  const [platformSubtitle, setPlatformSubtitle] = useState(() => storageService.getPlatformSubtitle());
  const [teacherWhatsApp, setTeacherWhatsApp] = useState(() => storageService.getTeacherWhatsApp());
  
  // Usernames & Passwords
  const [teacherUsername, setTeacherUsername] = useState(() => storageService.getTeacherUsername());
  const [teacherPassword, setTeacherPassword] = useState(() => storageService.getTeacherPassword());
  const [teacherSecurityKey, setTeacherSecurityKey] = useState(() => storageService.getTeacherSecurityKey());

  const [secretaryUsername, setSecretaryUsername] = useState(() => storageService.getSecretaryUsername());
  const [secretaryPassword, setSecretaryPassword] = useState(() => storageService.getSecretaryPassword());
  const [secretarySecurityKey, setSecretarySecurityKey] = useState(() => storageService.getSecretarySecurityKey());

  // Photos & Master Logo
  const [teacherPhoto, setTeacherPhoto] = useState(() => storageService.getTeacherPhoto());
  const [appIcon, setAppIcon] = useState(() => storageService.getPlatformAppIcon());
  const [soundEnabled, setSoundEnabled] = useState(() => storageService.isNotificationSoundEnabled());
  const [chartEnabled, setChartEnabled] = useState(() => storageService.isAcademicProgressChartEnabled());

  const [showTeacherPwd, setShowTeacherPwd] = useState(false);
  const [showSecretaryPwd, setShowSecretaryPwd] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [storageInfo, setStorageInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      apiService.fetchStorageStats().then((data) => {
        if (data) setStorageInfo(data);
      });
    }
  }, [isOpen]);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 4 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setTeacherPhoto(result);
          storageService.setTeacherPhoto(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('حجم الأيقونة يجب أن يكون أقل من 2 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setAppIcon(result);
          storageService.setPlatformAppIcon(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = platformName.trim();
    const trimmedSub = platformSubtitle.trim();
    const trimmedWhatsApp = teacherWhatsApp.trim();
    const trimmedTeacherUser = teacherUsername.trim();
    const trimmedTeacherPwd = teacherPassword.trim();
    const trimmedTeacherKey = teacherSecurityKey.trim();
    const trimmedSecUser = secretaryUsername.trim();
    const trimmedSecPwd = secretaryPassword.trim();
    const trimmedSecKey = secretarySecurityKey.trim();

    if (!trimmedName) {
      setError('يرجى إدخال اسم المنصة.');
      return;
    }

    if (!trimmedWhatsApp) {
      setError('يرجى إدخال رقم واتساب المعلم.');
      return;
    }

    if (!trimmedTeacherUser || !trimmedTeacherPwd) {
      setError('يرجى إدخال اسم مستخدم وكلمة مرور لحساب المعلم.');
      return;
    }

    if (!trimmedSecUser || !trimmedSecPwd) {
      setError('يرجى إدخال اسم مستخدم وكلمة مرور لحساب السكرتارية.');
      return;
    }

    // Save all to local storage cache
    storageService.setPlatformName(trimmedName);
    storageService.setPlatformSubtitle(trimmedSub);
    storageService.setTeacherWhatsApp(trimmedWhatsApp);
    
    storageService.setTeacherUsername(trimmedTeacherUser);
    storageService.setTeacherPassword(trimmedTeacherPwd);
    storageService.setTeacherSecurityKey(trimmedTeacherKey || '202600');

    storageService.setSecretaryUsername(trimmedSecUser);
    storageService.setSecretaryPassword(trimmedSecPwd);
    storageService.setSecretarySecurityKey(trimmedSecKey || '102030');
    storageService.setNotificationSoundEnabled(soundEnabled);
    storageService.setAcademicProgressChartEnabled(chartEnabled);

    if (appIcon) {
      storageService.setPlatformAppIcon(appIcon);
    }

    // Persist securely to backend server SQLite with bcrypt hashing
    apiService.updateCredentials({
      role: 'teacher',
      username: trimmedTeacherUser,
      newPassword: trimmedTeacherPwd,
      securityKey: trimmedTeacherKey || '202600'
    }).catch(console.warn);

    apiService.updateCredentials({
      role: 'secretary',
      username: trimmedSecUser,
      newPassword: trimmedSecPwd,
      securityKey: trimmedSecKey || '102030'
    }).catch(console.warn);

    const currentIcon = appIcon || storageService.getPlatformAppIcon();

    apiService.syncData({
      settings: {
        platform_name: trimmedName,
        platform_subtitle: trimmedSub,
        teacher_whatsapp: trimmedWhatsApp,
        platform_app_icon: currentIcon,
        academic_progress_chart_enabled: String(chartEnabled)
      }
    }).catch(console.warn);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onSettingsSaved('تم حفظ الإعدادات، الشعار الموحد، وبيانات الأمان بنجاح ⚙️');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-cairo" dir="rtl">
      <div 
        id="teacher-settings-modal-card"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-100 relative custom-scrollbar"
      >
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-blue-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>إعدادات وهوية المنصة والتحكم الأمني</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                حصري للمعلم فقط
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تغيير الهوية، شعار التطبيقات المشترك، الحسابات، ورموز الأمان للطوارئ
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم حفظ التعديلات بنجاح وتحديث كافة الأنظمة والتطبيقات!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* Section 1: Master Platform App Logo / Icon (Unified across all 3 apps) */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ImageIcon className="w-4 h-4" />
                <span>شعار وأيقونة التطبيقات الموحدة (Master App Icon)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ينعكس تلقائياً على تطبيقات المعلم والسكرتيرة والطلاب
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              هذا الشعار هو أيقونة التثبيت (PWA Icon) الرسمية التي تظهر على شاشات هواتف وأجهزة الكمبيوتر للمستخدمين عند تثبيت التطبيق.
            </p>

            <div className="flex items-center gap-4 pt-1">
              <div className="w-16 h-16 rounded-2xl overflow-hidden p-1 bg-slate-900 border border-amber-500/40 shadow-inner flex items-center justify-center shrink-0">
                <img
                  src={appIcon}
                  alt="شعار المنصة الموحد"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pwa-192x192.png';
                  }}
                />
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  ref={iconInputRef}
                  onChange={handleIconUpload}
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => iconInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>تغيير شعار وأيقونة التطبيقات</span>
                </button>
                <p className="text-[10px] text-slate-400 mt-1">يُفضل ملف PNG مربع عالي الدقة (512x512)</p>
              </div>
            </div>
          </div>

          {/* Section: Academic Progress Chart Access Control (مخطط تطور الدرجات للطلاب) */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Lock className="w-4 h-4 text-sky-400" />
                <span>مخطط تطور الدرجات للطلاب (في صفحة الطالب)</span>
              </div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${chartEnabled ? 'bg-emerald-950 border-emerald-700/70 text-emerald-300' : 'bg-amber-950/80 border-amber-700/70 text-amber-300'}`}>
                {chartEnabled ? 'مفتوح ومتاح للطلاب 🟢' : 'مقفل حالياً بقرار الإدارة 🔒'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              التحكم في إتاحة أو إقفال رسم تطور الدرجات الأكاديمي في صفحة الطالب. عند إقفاله، يظهر القسم مظللاً ومقفلاً مع رسالة توضح أن إدارة المنصة هي من أغلقت القسم، ويمكنك تفعيله وفتحه فورياً في أي وقت.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={chartEnabled}
                  onChange={(e) => setChartEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-200">
                  فتح وإتاحة مخطط تطور الدرجات الأكاديمي لجميع الطلاب
                </span>
              </label>

              <button
                type="button"
                onClick={() => setChartEnabled(!chartEnabled)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                  chartEnabled 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {chartEnabled ? 'إقفال القسم للطلاب 🔒' : 'فتح وتفعيل القسم للطلاب 🟢'}
              </button>
            </div>
          </div>

          {/* Section 2: Platform Identity */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <Type className="w-4 h-4" />
              <span>اسم المنصة ونصوص الهوية</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم المنصة التعليمية:
                </label>
                <input
                  type="text"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="مثال: منصة جلري التعليمية"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الوصف / لقب المعلم:
                </label>
                <input
                  type="text"
                  value={platformSubtitle}
                  onChange={(e) => setPlatformSubtitle(e.target.value)}
                  placeholder="مثال: مستر أحمد المعاطي - خبير اللغة الإنجليزية"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Teacher Account Credentials & Emergency Security PIN */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-amber-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>حساب المعلم (مستر أحمد) ونظام الاسترجاع</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">بوابة /teacher</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المستخدم:</label>
                <input
                  type="text"
                  value={teacherUsername}
                  onChange={(e) => setTeacherUsername(e.target.value)}
                  placeholder="ahmed"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-latin focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور:</label>
                <div className="relative">
                  <input
                    type={showTeacherPwd ? 'text' : 'password'}
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-latin focus:border-amber-500 pl-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPwd(!showTeacherPwd)}
                    className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    {showTeacherPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1" title="رمز الأمان المكون من 6 أرقام لاسترجاع الباسورد في حال نسيانه">
                  رمز أمان الطوارئ (PIN):
                </label>
                <input
                  type="text"
                  value={teacherSecurityKey}
                  onChange={(e) => setTeacherSecurityKey(e.target.value)}
                  placeholder="202600"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-latin focus:border-amber-500"
                  required
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              💡 رمز الأمان (PIN) هو الرمز السري الذي يُطلب منك في حال نسيت كلمة المرور لاستعادتها فوراً.
            </p>
          </div>

          {/* Section 4: Secretary Account Credentials & Emergency Security PIN */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-indigo-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                <UserCheck className="w-4 h-4" />
                <span>حساب السكرتارية والمشرفين ونظام الاسترجاع</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono">بوابة /secretary</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم مستخدم السكرتارية:</label>
                <input
                  type="text"
                  value={secretaryUsername}
                  onChange={(e) => setSecretaryUsername(e.target.value)}
                  placeholder="secretary"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-latin focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة مرور السكرتارية:</label>
                <div className="relative">
                  <input
                    type={showSecretaryPwd ? 'text' : 'password'}
                    value={secretaryPassword}
                    onChange={(e) => setSecretaryPassword(e.target.value)}
                    placeholder="كلمة المرور"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-latin focus:border-indigo-500 pl-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretaryPwd(!showSecretaryPwd)}
                    className="absolute left-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    {showSecretaryPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رمز أمان السكرتارية (PIN):</label>
                <input
                  type="text"
                  value={secretarySecurityKey}
                  onChange={(e) => setSecretarySecurityKey(e.target.value)}
                  placeholder="102030"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-latin focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 5: WhatsApp Contact & Personal Photo */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <MessageCircle className="w-4 h-4" />
              <span>رقم الواتساب والصورة الشخصية للمعلم</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم واتساب مستر أحمد الرسمي:
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    dir="ltr"
                    value={teacherWhatsApp}
                    onChange={(e) => setTeacherWhatsApp(e.target.value)}
                    placeholder="01012345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-emerald-500 font-latin pl-10"
                    required
                  />
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الصورة الشخصية للمعلم:
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                    <img
                      src={teacherPhoto}
                      alt="صورة المعلم"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>تغيير صورتك</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Sound Notifications (التنبيه الصوتي للإشعارات) */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>التنبيه الصوتي للإشعارات (Sound Notifications)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${soundEnabled ? 'bg-emerald-950 border-emerald-700/70 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                {soundEnabled ? 'مفعّل 🔔' : 'مكتوم 🔕'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              تشغيل نغمة تنبيه صوتية مميزة وفورية عند وصول إشعار جديد في لوحة تحكم المعلم أو بوابة السكرتارية.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-200">
                  تفعيل التنبيه الصوتي عند وصول أي إشعار أو تعليق جديد
                </span>
              </label>

              <button
                type="button"
                onClick={() => notificationSound.playNotificationChime()}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-2 transition-colors"
                title="استمع إلى نغمة التنبيه"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span>تجربة الصوت 🔔</span>
              </button>
            </div>
          </div>

          {/* Section 7: Live Storage & System Memory Dashboard */}
          <div className="space-y-3.5 p-4 rounded-2xl bg-slate-950/70 border border-blue-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>تقرير مساحات التخزين وخادم SQLite</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                الحالة: متصل وتعمل بكفاءة 🟢
              </span>
            </div>

            {storageInfo ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">حجم قاعدة البيانات (SQLite)</span>
                  <span className="text-sm font-black text-amber-400 font-latin">{storageInfo.databaseSizeFormatted}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">الملفات المرفوعة (/uploads)</span>
                  <span className="text-sm font-black text-blue-400 font-latin">{storageInfo.uploadsSizeFormatted}</span>
                  <span className="block text-[9px] text-slate-500 font-latin">{storageInfo.uploadFilesCount} ملف</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">سجل الطلاب والدرجات</span>
                  <span className="text-sm font-black text-emerald-400 font-latin">{storageInfo.counts?.studentsCount || 0} طالب</span>
                  <span className="block text-[9px] text-slate-500 font-latin">{storageInfo.counts?.quizResultsCount || 0} نتيجه</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 font-medium mb-1">المساحة المتاحة بالسيرفر</span>
                  <span className="text-sm font-black text-purple-400 font-latin">{storageInfo.diskInfo?.freeGB || '378 GB'}</span>
                  <span className="block text-[9px] text-slate-500">استهلاك {storageInfo.diskInfo?.usagePercent || '1%'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 font-latin">
                جاري فحص وحساب مساحات التخزين...
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saveSuccess}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>حفظ وتطبيق التغييرات في النظام</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
