export type PortalRole = 'teacher' | 'secretary' | 'student' | 'parent' | 'student_parent' | 'standalone_teacher';

export const getBaseOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // If embedded inside Google AI Studio parent iframe, use the direct development origin
    if (window.location.origin.includes('google.com')) {
      return 'https://ais-dev-wivuv6clztv53mmyvz7r7a-656032955753.europe-west2.run.app';
    }
    return window.location.origin;
  }
  return 'https://ais-dev-wivuv6clztv53mmyvz7r7a-656032955753.europe-west2.run.app';
};

export const getPortalUrl = (role: PortalRole): string => {
  const origin = getBaseOrigin();

  switch (role) {
    case 'teacher':
      return `${origin}/teacher`;
    case 'secretary':
      return `${origin}/secretary`;
    case 'student_parent':
    case 'student':
    case 'parent':
      // رابط الطالب وولي الأمر موحد برابط واحد
      return `${origin}/`;
    case 'standalone_teacher':
      return `${origin}/teacher?mode=standalone`;
  }
};

export const getPortalTitle = (role: PortalRole): string => {
  switch (role) {
    case 'teacher':
      return 'لوحة المعلم - مستر أحمد المعاطي';
    case 'secretary':
      return 'لوحة السكرتير والإدارة';
    case 'student_parent':
    case 'student':
    case 'parent':
      return 'منصة جلري - الطالب وولي الأمر';
    case 'standalone_teacher':
      return 'تطبيق المعلم المستقل';
  }
};

export const getPortalShortName = (role: PortalRole): string => {
  switch (role) {
    case 'teacher':
      return 'صفحة المعلم';
    case 'secretary':
      return 'صفحة السكرتير';
    case 'student_parent':
    case 'student':
    case 'parent':
      return 'الطالب وولي الأمر (رابط موحد)';
    case 'standalone_teacher':
      return 'تطبيق المعلم';
  }
};

export const copyPortalLinkToClipboard = async (
  role: PortalRole,
  onSuccess?: (msg: string) => void
): Promise<boolean> => {
  const url = getPortalUrl(role);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    } else if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    if (onSuccess) {
      onSuccess(`تم نسخ رابط (${getPortalShortName(role)}) بنجاح! 📋`);
    }
    return true;
  } catch (err) {
    console.error('Failed to copy link', err);
    return false;
  }
};

export const downloadPortalShortcut = (role: PortalRole, customUrl?: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const url = customUrl || getPortalUrl(role);

  // Clean ASCII filename without spaces so Windows never saves as .download
  let filename = 'Glary-Platform.url';
  if (role === 'teacher') filename = 'Glary-Teacher-Dashboard.url';
  else if (role === 'secretary') filename = 'Glary-Secretary.url';
  else filename = 'Glary-Student-Parent.url';

  const shortcutContent = `[InternetShortcut]\r\nURL=${url}\r\nIDList=\r\nIconIndex=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,0\r\n`;
  const blob = new Blob([shortcutContent], { type: 'application/x-mswinurl' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
};
