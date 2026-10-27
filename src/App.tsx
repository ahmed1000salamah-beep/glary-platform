/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Student } from './types';
import { storageService } from './services/storage';
import { apiService } from './services/api';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useNotifications } from './hooks/useNotifications';
import { NotificationFilterContext } from './utils/notificationFilter';
import { Navbar } from './components/Navbar';
import { StaffAuthGate } from './components/auth/StaffAuthGate';
import { PWAInstallGuideModal } from './components/PWAInstallGuideModal';
import { NotificationsModal } from './components/NotificationsModal';
import { StudentPortal } from './components/student/StudentPortal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherSettingsModal } from './components/teacher/TeacherSettingsModal';
import { TeacherStandaloneApp } from './components/teacher/TeacherStandaloneApp';
import { PortalRole } from './services/portalLinks';
import { 
  WifiOff, 
  Bell, 
  Sparkles, 
  ShieldCheck
} from 'lucide-react';

export default function App() {
  // Determine current route path strictly or remembered staff device
  const getInitialPortal = (): 'teacher' | 'secretary' | 'public' => {
    if (typeof window === 'undefined') return 'public';
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    if (path.startsWith('/teacher') || search.includes('role=teacher') || search.includes('portal=teacher') || hash.includes('teacher')) {
      return 'teacher';
    }
    if (path.startsWith('/secretary') || search.includes('role=secretary') || search.includes('portal=secretary') || hash.includes('secretary')) {
      return 'secretary';
    }
    const rememberedRole = localStorage.getItem('glary_remembered_staff_role');
    if (rememberedRole === 'teacher') return 'teacher';
    if (rememberedRole === 'secretary') return 'secretary';
    return 'public';
  };

  const [portalMode, setPortalMode] = useState<'teacher' | 'secretary' | 'public'>(getInitialPortal);

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setPortalMode(getInitialPortal());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Authentication states for staff portals (persists across restarts)
  const [teacherAuthenticated, setTeacherAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('glary_staff_auth') === 'teacher' || sessionStorage.getItem('glary_staff_auth') === 'teacher';
  });

  const [secretaryAuthenticated, setSecretaryAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('glary_staff_auth') === 'secretary' || sessionStorage.getItem('glary_staff_auth') === 'secretary';
  });

  // Current active role for public portal (exclusively 'student')
  const currentPublicRole: 'student' = 'student';

  // Standalone Teacher Portal (USB Flash App)
  const [isTeacherStandaloneApp, setIsTeacherStandaloneApp] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      return search.includes('mode=teacher_portal') || search.includes('mode=standalone');
    }
    return false;
  });

  // Student active session state with 2-week auto login validity check
  const [activeStudentCode, setActiveStudentCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedCode = localStorage.getItem('glary_active_student_code') || localStorage.getItem('glary_remembered_student_code');
    if (savedCode && storageService.isStudentAutoLoginValid()) {
      return savedCode;
    }
    localStorage.removeItem('glary_active_student_code');
    return null;
  });

  const activeStudent = useMemo<Student | null>(() => {
    if (!activeStudentCode) return null;
    return storageService.getStudentByCode(activeStudentCode) || null;
  }, [activeStudentCode]);

  // Contextual notification targeting for currently active user
  const notificationContext = useMemo<NotificationFilterContext>(() => {
    if (portalMode === 'teacher') return { role: 'teacher' };
    if (portalMode === 'secretary') return { role: 'secretary' };
    return {
      role: 'student',
      student: activeStudent
    };
  }, [portalMode, activeStudent]);

  // Modals state
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);
  const [pwaModalTargetRole, setPwaModalTargetRole] = useState<PortalRole | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showTeacherSettingsModal, setShowTeacherSettingsModal] = useState(false);
  const [settingsVersion, setSettingsVersion] = useState(0);

  // Online / Offline status
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // PWA and Notifications hooks
  const { isInstallable, isInstalled, isIOS, isWindows, isAndroid, install } = usePWAInstall();
  const {
    notifications,
    unreadCount,
    permission,
    activeToast,
    closeToast,
    requestPermission,
    showLocalNotification,
    refreshNotifications,
    markAsRead,
  } = useNotifications(notificationContext);

  // Auto background refresh every 3 minutes (180,000 ms) to keep all data synchronized
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glary_storage_changed'));
        window.dispatchEvent(new CustomEvent('glary_homework_assigned', { detail: { action: 'refresh' } }));
        window.dispatchEvent(new CustomEvent('glary_materials_updated', { detail: { action: 'refresh' } }));
        window.dispatchEvent(new CustomEvent('glary_videos_updated', { detail: { action: 'refresh' } }));
        window.dispatchEvent(new CustomEvent('glary_quizzes_updated', { detail: { action: 'refresh' } }));
      }
      refreshNotifications();
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(autoRefreshInterval);
  }, [refreshNotifications]);

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync document titles and PWA metadata with portal mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const manifestLink = document.getElementById('app-manifest-link') as HTMLLinkElement | null;
    const themeMeta = document.getElementById('meta-theme-color') as HTMLMetaElement | null;
    const appleTitle = document.getElementById('apple-app-title') as HTMLMetaElement | null;
    const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
    const appleIcon = document.getElementById('app-apple-icon') as HTMLLinkElement | null;

    const customMasterIcon = storageService.getPlatformAppIcon();

    if (portalMode === 'teacher') {
      document.title = 'منصة مستر أحمد المعاطي - تطبيق المعلم';
      if (manifestLink) manifestLink.href = '/manifest-teacher.json';
      if (themeMeta) themeMeta.content = '#d97706';
      if (appleTitle) appleTitle.content = 'المعلم - جلري';
      if (favicon) favicon.href = customMasterIcon || '/pwa-teacher-192.png';
      if (appleIcon) appleIcon.href = customMasterIcon || '/pwa-teacher-512.png';
    } else if (portalMode === 'secretary') {
      document.title = 'منصة مستر أحمد المعاطي - تطبيق السكرتارية';
      if (manifestLink) manifestLink.href = '/manifest-secretary.json';
      if (themeMeta) themeMeta.content = '#6366f1';
      if (appleTitle) appleTitle.content = 'السكرتارية - جلري';
      if (favicon) favicon.href = customMasterIcon || '/pwa-secretary-192.png';
      if (appleIcon) appleIcon.href = customMasterIcon || '/pwa-secretary-512.png';
    } else {
      document.title = 'منصة جلري التعليمية | مستر أحمد المعاطي';
      if (manifestLink) manifestLink.href = '/manifest-student.json';
      if (themeMeta) themeMeta.content = '#1d4ed8';
      if (appleTitle) appleTitle.content = 'منصة جلري';
      if (favicon) favicon.href = customMasterIcon || '/pwa-student-192.png';
      if (appleIcon) appleIcon.href = customMasterIcon || '/pwa-student-512.png';
    }
  }, [portalMode, settingsVersion]);

  const handleSettingsSaved = (msg: string) => {
    setSettingsVersion((v) => v + 1);
    showLocalNotification('إعدادات المنصة ⚙️', msg);
  };

  // Open PWA install modal with optional preselected role tab
  const handleOpenPWAInstall = (role?: PortalRole) => {
    const target = role || (portalMode === 'teacher' ? 'teacher' : portalMode === 'secretary' ? 'secretary' : 'student');
    setPwaModalTargetRole(target);
    setShowPWAInstallModal(true);
  };

  // Staff logout
  const handleTeacherLogout = () => {
    apiService.clearToken();
    sessionStorage.removeItem('glary_staff_auth');
    localStorage.removeItem('glary_staff_auth');
    localStorage.removeItem('glary_remembered_staff_role');
    setTeacherAuthenticated(false);
    setPortalMode('public');
    window.history.pushState({}, '', '/');
  };

  const handleSecretaryLogout = () => {
    apiService.clearToken();
    sessionStorage.removeItem('glary_staff_auth');
    localStorage.removeItem('glary_staff_auth');
    localStorage.removeItem('glary_remembered_staff_role');
    setSecretaryAuthenticated(false);
    setPortalMode('public');
    window.history.pushState({}, '', '/');
  };

  // Switch to Staff Dashboard directly when teacher or secretary uses secret student credentials
  const handleSwitchToStaffFromStudent = (role: 'teacher' | 'secretary') => {
    localStorage.setItem('glary_remembered_staff_role', role);
    localStorage.setItem('glary_staff_auth', role);
    sessionStorage.setItem('glary_staff_auth', role);

    if (role === 'teacher') {
      setTeacherAuthenticated(true);
      setPortalMode('teacher');
      window.history.pushState({}, '', '/teacher');
      showLocalNotification('أهلاً بك يا مستر أحمد 🌟', 'تم الدخول المباشر إلى لوحة تحكم المعلم.');
    } else {
      setSecretaryAuthenticated(true);
      setPortalMode('secretary');
      window.history.pushState({}, '', '/secretary');
      showLocalNotification('أهلاً بك في بوابة السكرتارية 📋', 'تم الدخول المباشر إلى بوابة السكرتارية.');
    }
  };

  // Public student logout
  const handlePublicLogout = () => {
    storageService.clearStudentSession();
    setActiveStudentCode(null);
  };

  // Render Standalone USB Teacher App if requested
  if (isTeacherStandaloneApp) {
    return (
      <TeacherStandaloneApp
        onExitToMainSite={() => {
          setIsTeacherStandaloneApp(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('mode');
          window.history.replaceState({}, '', url.toString());
        }}
        onSendNotificationToast={showLocalNotification}
      />
    );
  }

  // ==========================================
  // 1. SECTION 1: TEACHER PORTAL (/teacher)
  // ==========================================
  if (portalMode === 'teacher') {
    if (!teacherAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-cairo" dir="rtl">
          <StaffAuthGate
            role="teacher"
            onAuthenticated={() => {
              setTeacherAuthenticated(true);
              showLocalNotification('أهلاً بك يا مستر أحمد 🌟', 'تم تسجيل الدخول بصلاحيات التحكم الكاملة.');
            }}
            onGoHome={() => {
              window.location.href = '/';
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-cairo antialiased selection:bg-amber-500 selection:text-slate-950">
        <Navbar
          currentRole="teacher"
          onOpenStaffModal={() => {}}
          onOpenPWAInstall={handleOpenPWAInstall}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onLogout={handleTeacherLogout}
          unreadCount={unreadCount}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onInstall={install}
          onOpenTeacherSettings={() => setShowTeacherSettingsModal(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          <TeacherDashboard
            role="teacher"
            onBackToRoles={handleTeacherLogout}
            onSendNotificationToast={showLocalNotification}
            onOpenTeacherStandaloneApp={() => setIsTeacherStandaloneApp(true)}
            onOpenPWAInstall={handleOpenPWAInstall}
          />
        </main>

        <footer className="bg-slate-950 border-t border-slate-900 py-5 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 منصة جلري التعليمية • لوحة تحكم المعلم (مستر أحمد المعاطي)</p>
          </div>
        </footer>

        {/* Modals for Teacher */}
        <TeacherSettingsModal
          isOpen={showTeacherSettingsModal}
          onClose={() => setShowTeacherSettingsModal(false)}
          onSettingsSaved={handleSettingsSaved}
        />

        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          notifications={notifications}
          permission={permission}
          onRequestPermission={requestPermission}
          onMarkRead={markAsRead}
        />

        <PWAInstallGuideModal
          isOpen={showPWAInstallModal}
          onClose={() => setShowPWAInstallModal(false)}
          isInstallable={isInstallable}
          onInstall={install}
          isIOS={isIOS}
          isWindows={isWindows}
          isAndroid={isAndroid}
          initialRole="teacher"
        />
      </div>
    );
  }

  // ==========================================
  // 2. SECTION 2: SECRETARY PORTAL (/secretary)
  // ==========================================
  if (portalMode === 'secretary') {
    if (!secretaryAuthenticated) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col font-cairo" dir="rtl">
          <StaffAuthGate
            role="secretary"
            onAuthenticated={() => {
              setSecretaryAuthenticated(true);
              showLocalNotification('أهلاً بك في بوابة السكرتارية 📋', 'تم تسجيل الدخول بنجاح لإدارة الطلاب والغياب والأكواد.');
            }}
            onGoHome={() => {
              window.location.href = '/';
            }}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-cairo antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar
          currentRole="secretary"
          onOpenStaffModal={() => {}}
          onOpenPWAInstall={handleOpenPWAInstall}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onLogout={handleSecretaryLogout}
          unreadCount={unreadCount}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onInstall={install}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          <TeacherDashboard
            role="secretary"
            onBackToRoles={handleSecretaryLogout}
            onSendNotificationToast={showLocalNotification}
            onOpenPWAInstall={handleOpenPWAInstall}
          />
        </main>

        <footer className="bg-slate-950 border-t border-slate-900 py-5 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 منصة جلري التعليمية • بوابة السكرتارية والإشراف الأكاديمي</p>
          </div>
        </footer>

        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          notifications={notifications}
          permission={permission}
          onRequestPermission={requestPermission}
          onMarkRead={markAsRead}
        />

        <PWAInstallGuideModal
          isOpen={showPWAInstallModal}
          onClose={() => setShowPWAInstallModal(false)}
          isInstallable={isInstallable}
          onInstall={install}
          isIOS={isIOS}
          isWindows={isWindows}
          isAndroid={isAndroid}
          initialRole="secretary"
        />
      </div>
    );
  }

  // ===================================================
  // 3. SECTION 3: PUBLIC STUDENT & PARENT PORTAL (/)
  // ===================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-cairo antialiased selection:bg-blue-600 selection:text-white">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-amber-600/90 backdrop-blur-sm text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>أنت تعمل حالياً في وضع عدم الاتصال (Offline). البيانات المحفوظة متاحة بالكامل.</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentRole={currentPublicRole}
        isAuthenticated={Boolean(activeStudentCode)}
        onOpenStaffModal={() => {}}
        onOpenPWAInstall={handleOpenPWAInstall}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onLogout={handlePublicLogout}
        unreadCount={unreadCount}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstall={install}
      />

      {/* Main Public View: Direct Student Portal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <StudentPortal
          onBackToRoles={handlePublicLogout}
          onSendNotificationToast={showLocalNotification}
          onOpenPWAInstall={handleOpenPWAInstall}
          onSwitchToStaffPortal={handleSwitchToStaffFromStudent}
          onStudentLogin={(student) => {
            setActiveStudentCode(student.code);
            refreshNotifications();
          }}
          onStudentLogout={() => {
            storageService.clearStudentSession();
            setActiveStudentCode(null);
          }}
        />
      </main>

      {/* Footer - Public */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 {storageService.getPlatformName()} • {storageService.getPlatformSubtitle()}</p>
        </div>
      </footer>

      {/* PWA Install Guide Modal */}
      <PWAInstallGuideModal
        isOpen={showPWAInstallModal}
        onClose={() => setShowPWAInstallModal(false)}
        isInstallable={isInstallable}
        onInstall={install}
        isIOS={isIOS}
        isWindows={isWindows}
        isAndroid={isAndroid}
        initialRole={pwaModalTargetRole}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={notifications}
        permission={permission}
        onRequestPermission={requestPermission}
        onMarkRead={markAsRead}
      />
    </div>
  );
}
