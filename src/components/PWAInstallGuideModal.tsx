import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Smartphone, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Users, 
  ShieldCheck, 
  ClipboardList,
  Link as LinkIcon,
  Sparkles
} from 'lucide-react';
import { 
  PortalRole, 
  getPortalUrl, 
  getPortalTitle, 
  getPortalShortName, 
  copyPortalLinkToClipboard, 
  downloadPortalShortcut,
  getBaseOrigin
} from '../services/portalLinks';
import { MonitorDownInstallIcon } from './common/AppInstallButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  onInstall: () => void;
  isIOS: boolean;
  isWindows: boolean;
  isAndroid: boolean;
  initialRole?: PortalRole | null;
}

export const PWAInstallGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isInstallable,
  onInstall,
  initialRole = null
}) => {
  const [selectedRole, setSelectedRole] = useState<PortalRole>(() => {
    if (initialRole === 'secretary') return 'secretary';
    if (initialRole === 'teacher') return 'teacher';
    return 'student_parent';
  });

  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = getPortalUrl(selectedRole);

  const handleCopyLink = async (role: PortalRole) => {
    const ok = await copyPortalLinkToClipboard(role);
    if (ok) {
      setCopiedRole(role);
      setTimeout(() => setCopiedRole(null), 2500);
    }
  };

  const handleOpenInNewTab = (roleToOpen = selectedRole) => {
    const url = getPortalUrl(roleToOpen);
    window.open(url, '_blank');
  };

  const handleDownloadWindowsShortcut = () => {
    downloadPortalShortcut(selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-cairo">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 relative max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with the Blue Monitor-Down Icon */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-900/30 shrink-0">
            <MonitorDownInstallIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              التنزيل من شريط المتصفح + الروابط الثلاثة المباشرة
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              لتظهر علامة التنزيل الزرقاء في شريط المتصفح (URL Bar) بالأعلى كما في صورتك
            </p>
          </div>
        </div>

        {/* Highlight Box: Address Bar Explanation as in User Image */}
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-blue-950/90 to-indigo-950/90 border-2 border-blue-500 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500 border border-blue-200 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md">
              <MonitorDownInstallIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1 text-right">
              <h4 className="text-sm font-black text-white">
                كيف تظهر لك علامة التنزيل الزرقاء (🖥️) في شريط المتصفح فوق؟
              </h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                علامة التنزيل الظاهرة في صورتك تظهر داخل **شريط عنوان متصفح كروم أو إيدج (URL Bar)** عندما تفتح الموقع في صفحة متصفح عادية (وليس داخل معاينة الاستوديو).
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenInNewTab(selectedRole)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-600/40 flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>اضغط هنا لفتح الرابط في نافذة جديدة والتنزيل من شريط المتصفح</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Dedicated Role Tabs: Teacher alone, Secretary alone, Student & Parent together */}
        <div className="mb-4 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setSelectedRole('teacher')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              selectedRole === 'teacher'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. صفحة المعلم (لوحده)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('secretary')}
            className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              selectedRole === 'secretary'
                ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>2. صفحة السكرتير (لوحده)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('student_parent')}
            className={`flex-1 min-w-[150px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              selectedRole === 'student_parent' || selectedRole === 'student' || selectedRole === 'parent'
                ? 'bg-blue-600 text-white shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. الطالب وولي الأمر (رابط موحد)</span>
          </button>
        </div>

        {/* Selected Link Details */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  رابط {getPortalShortName(selectedRole)} المباشر:
                </h4>
                <p className="text-[11px] text-blue-300 font-latin" dir="ltr">
                  {currentUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyLink(selectedRole)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
              >
                {copiedRole === selectedRole ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الرابط</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenInNewTab(selectedRole)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح النافذة</span>
              </button>
            </div>
          </div>

          {/* Quick Windows Shortcut file */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-slate-400">
              أو نزل ملف اختصار مباشر لسطح المكتب (.url):
            </span>
            <button
              type="button"
              onClick={handleDownloadWindowsShortcut}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل اختصار PC</span>
            </button>
          </div>
        </div>

        {/* In-app 1-click install button if triggered */}
        {isInstallable && (
          <div className="mb-4">
            <button
              onClick={() => {
                onInstall();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <MonitorDownInstallIcon className="w-4 h-4" />
              <span>تثبيت مباشر بنقرة واحدة الآن</span>
            </button>
          </div>
        )}

        {/* Easy instructions */}
        <div className="space-y-2 text-xs text-right">
          <div className="p-3 rounded-2xl bg-sky-950/20 border border-sky-600/40">
            <div className="flex items-center gap-2 font-bold text-sky-300 mb-1">
              <Monitor className="w-4 h-4" />
              <span>خطوات التثبيت من شريط المتصفح (ويندوز PC):</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              1. افتح الرابط المنسوخ في نافذة عادية في Google Chrome أو Microsoft Edge.<br />
              2. انظر لشريط الرابط (URL Bar) بالأعلى يميناً أو يساراً ستجد نفس العلامة الزرقاء <strong>(🖥️ مع سهم التنزيل)</strong> كما في صورتك.<br />
              3. اضغط عليها واختر <strong>تثبيت (Install)</strong> وسيتم وضع التطبيق مباشرة على سطح المكتب.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-600/30">
            <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
              <Smartphone className="w-4 h-4" />
              <span>لهواتف أندرويد (Android):</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              افتح الرابط في Chrome واضغط الثلاث نقاط (⋮) بالأعلى ثم اختر <strong>«تثبيت التطبيق» (Install App)</strong> أو «إضافة للشاشة الرئيسية».
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">منصة جلري التعليمية • مستر أحمد المعاطي</span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
