import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Download } from 'lucide-react';
import { PortalRole, copyPortalLinkToClipboard, getPortalShortName } from '../../services/portalLinks';

// The exact icon from user image: Computer monitor with downward arrow inside a blue circle
export const MonitorDownInstallIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    stroke="currentColor"
    strokeWidth="2.3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Computer monitor outline */}
    <rect x="2.5" y="3.5" width="19" height="13" rx="2.5" />
    {/* Monitor stand */}
    <path d="M8 20.5h8" />
    <path d="M12 16.5v4" />
    {/* Download arrow inside monitor */}
    <path d="M12 6.5v6" />
    <path d="M9 9.5l3 3 3-3" />
  </svg>
);

interface Props {
  role?: PortalRole | null;
  onOpenPWAInstall: (targetRole?: PortalRole) => void;
  onSendNotificationToast?: (title: string, body: string) => void;
  showCopyLink?: boolean;
  variant?: 'navbar' | 'header' | 'banner';
  className?: string;
}

export const AppInstallButton: React.FC<Props> = ({
  role = null,
  onOpenPWAInstall,
  onSendNotificationToast,
  showCopyLink = false,
  variant = 'header',
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!role) return;
    const ok = await copyPortalLinkToClipboard(role, (msg) => {
      if (onSendNotificationToast) {
        onSendNotificationToast('تم نسخ الرابط المباشر 📋', msg);
      }
    });
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  if (variant === 'navbar') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Main Install Button with the blue circular monitor icon */}
        <button
          type="button"
          onClick={() => onOpenPWAInstall(role || undefined)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-700/80 via-blue-600/90 to-indigo-600/90 hover:from-blue-600 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/40 border border-blue-400/40 group active:scale-95"
          title="تثبيت المنصة كتطبيق مثبت للكمبيوتر والويندوز والموبايل أندرويد"
        >
          {/* Blue circle badge with white monitor-down icon matching user photo */}
          <div className="w-5 h-5 rounded-full bg-blue-500/90 border border-blue-200/50 flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-110 transition-transform">
            <MonitorDownInstallIcon className="w-3.5 h-3.5" />
          </div>
          <span className="hidden lg:inline whitespace-nowrap">تثبيت كتطبيق للويندوز وأندرويد</span>
          <span className="lg:hidden whitespace-nowrap">تثبيت التطبيق</span>
        </button>

        {/* Copy Direct Link button if on a specific role page */}
        {showCopyLink && role && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-sm"
            title={`نسخ رابط ${getPortalShortName(role)} المباشر لمشاركته أو حفظه`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-300 font-bold hidden sm:inline">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] hidden sm:inline">نسخ الرابط</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  // Header / Prominent Variant (used inside each role's header bar)
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Install Button with Requested Icon */}
      <button
        type="button"
        onClick={() => onOpenPWAInstall(role || undefined)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/30 border border-blue-400/40 group active:scale-95 shrink-0"
        title="تثبيت الصفحة كتطبيق مستقل لسطح المكتب (Windows) أو الهاتف (Android)"
      >
        <div className="w-6 h-6 rounded-full bg-blue-500 border border-blue-200/60 flex items-center justify-center text-white shadow-sm shrink-0 group-hover:scale-110 transition-transform">
          <MonitorDownInstallIcon className="w-4 h-4" />
        </div>
        <div className="text-right">
          <div className="font-bold whitespace-nowrap text-white leading-tight">
            تثبيت كتطبيق للويندوز وأندرويد
          </div>
          <div className="text-[10px] text-blue-200 font-normal hidden sm:block">
            سطح المكتب والموبايل
          </div>
        </div>
      </button>

      {/* Copy Direct Link button */}
      {showCopyLink && role && (
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all shadow-sm shrink-0 hover:border-blue-500/40"
          title={`نسخ رابط ${getPortalShortName(role)} المباشر`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300">تم نسخ الرابط!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-blue-400" />
              <span>نسخ رابط الصفحة</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
