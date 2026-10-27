import React from 'react';
import { 
  BookOpen, 
  MoreVertical, 
  Download, 
  Bell, 
  LogOut, 
  Users, 
  GraduationCap, 
  Shield, 
  Smartphone,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  UserPlus,
  Settings
} from 'lucide-react';
import { UserRole } from '../types';
import { storageService } from '../services/storage';
import { PortalRole } from '../services/portalLinks';

interface Props {
  currentRole: UserRole | null;
  isAuthenticated?: boolean;
  onOpenStaffModal: () => void;
  onOpenPWAInstall: (targetRole?: PortalRole) => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  unreadCount: number;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  onOpenAddChildModal?: () => void;
  onOpenTeacherSettings?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentRole,
  isAuthenticated,
  onOpenStaffModal,
  onOpenPWAInstall,
  onOpenNotifications,
  onLogout,
  unreadCount,
  isInstallable,
  isInstalled,
  onInstall,
  onOpenAddChildModal,
  onOpenTeacherSettings,
}) => {
  const [platformName, setPlatformName] = React.useState(() => storageService.getPlatformName());
  const [platformSubtitle, setPlatformSubtitle] = React.useState(() => storageService.getPlatformSubtitle());
  const [teacherPhoto, setTeacherPhoto] = React.useState(() => storageService.getTeacherPhoto());
  const [navImgFailed, setNavImgFailed] = React.useState(false);
  const isFullyAuthenticated = isAuthenticated !== undefined ? isAuthenticated : Boolean(currentRole);

  React.useEffect(() => {
    const handleSettingsUpdate = () => {
      setPlatformName(storageService.getPlatformName());
      setPlatformSubtitle(storageService.getPlatformSubtitle());
      setTeacherPhoto(storageService.getTeacherPhoto());
      setNavImgFailed(false);
    };

    window.addEventListener('glary_platform_settings_updated', handleSettingsUpdate);
    window.addEventListener('glary_storage_changed', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    return () => {
      window.removeEventListener('glary_platform_settings_updated', handleSettingsUpdate);
      window.removeEventListener('glary_storage_changed', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-400 to-blue-600 shadow-lg shadow-blue-600/20 shrink-0 flex items-center justify-center">
            {!navImgFailed && teacherPhoto ? (
              <img
                src={teacherPhoto}
                alt="مستر أحمد المعاطي"
                referrerPolicy="no-referrer"
                onError={() => setNavImgFailed(true)}
                className="w-full h-full object-cover rounded-[14px]"
              />
            ) : (
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-amber-400 font-black text-base border border-amber-500/40">
                <span>أ</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                {platformName}
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800/60 text-[10px] text-blue-300 font-bold font-latin">
                ENGLISH PRO
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              {platformSubtitle}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Teacher Settings Button (علامة الترس في الشريط الفوق في صفحة المعلم بس) */}
          {currentRole === 'teacher' && onOpenTeacherSettings && (
            <button
              onClick={onOpenTeacherSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm hover:scale-[1.02] group"
              title="إعدادات المنصة وتغيير كلمات المرور (خاص بالمعلم فقط)"
            >
              <Settings className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">إعدادات المنصة</span>
            </button>
          )}
          {/* WhatsApp Button - Icon button matching the adjacent icons */}
          {currentRole !== 'teacher' && currentRole !== 'secretary' && (
            <a
              href={storageService.getTeacherWhatsAppLink(
                currentRole === 'student' 
                  ? 'السلام عليكم مستر أحمد، أنا طالب مسجل في منصة جلري ولدي استفسار بخصوص الحصص والدروس.' 
                  : undefined
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-900 hover:bg-emerald-950/50 border border-slate-700/80 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 flex items-center justify-center transition-colors shadow-sm group"
              title="مراسلة مستر أحمد المعاطي مباشرة عبر واتساب"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </a>
          )}

          {/* Notifications Button - Only shown when user is logged in */}
          {isFullyAuthenticated && (
            <button
              onClick={onOpenNotifications}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-850 relative transition-colors"
              title="الإشعارات والتنبيهات الفورية"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-latin animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Current Role Badge or Logout Button - Only shown when user is logged in */}
          {currentRole && isFullyAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200">
                {currentRole === 'student' && <GraduationCap className="w-3.5 h-3.5 text-blue-400" />}
                {currentRole === 'teacher' && <Shield className="w-3.5 h-3.5 text-amber-400" />}
                {currentRole === 'secretary' && <Shield className="w-3.5 h-3.5 text-indigo-400" />}
                <span>
                  {currentRole === 'student' ? 'طالب' :
                   currentRole === 'teacher' ? 'مستر أحمد المعاطي' : 'السكرتارية'}
                </span>
              </span>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="تسجيل الخروج من الحساب"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
