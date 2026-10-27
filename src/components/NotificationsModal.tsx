import React from 'react';
import { X, Bell, Check, BellRing, Info, Award, AlertTriangle, Calendar } from 'lucide-react';
import { PlatformNotification } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: PlatformNotification[];
  permission: NotificationPermission;
  onRequestPermission: () => Promise<boolean>;
  onMarkRead: (id: string) => void;
}

export const NotificationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  notifications,
  permission,
  onRequestPermission,
  onMarkRead,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'grade':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'attendance':
        return <Calendar className="w-5 h-5 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">مركز الإشعارات والتنبيهات</h3>
              <p className="text-xs text-slate-400">إشعارات مستر أحمد المعاطي اللحظية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Request Banner or Active Status */}
        {permission !== 'granted' ? (
          <div className="my-4 p-3.5 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-600/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-blue-400 shrink-0 animate-bounce" />
              <p className="text-xs text-blue-200 font-medium">فعّل الإشعارات لتصلك نتائج الامتحانات والتسميع فور رصدها!</p>
            </div>
            <button
              onClick={onRequestPermission}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shrink-0 transition-colors shadow-md shadow-blue-900/40"
            >
              تفعيل الآن
            </button>
          </div>
        ) : (
          <div className="my-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-md shadow-emerald-950/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs text-emerald-200 font-bold">التنبيهات الفورية مفعّلة بنجاح ✓</p>
                <p className="text-[10px] text-emerald-400/80">ستصلك نتائج الامتحانات والحضور والتسميع أولاً بأول</p>
              </div>
            </div>
            <button
              onClick={onRequestPermission}
              className="px-2.5 py-1 bg-emerald-650/40 hover:bg-emerald-600/60 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold rounded-lg transition-colors shrink-0"
              title="إرسال إشعار تجريبي للتأكد"
            >
              تجربة إشعار 🔔
            </button>
          </div>
        )}

        {/* List of notifications */}
        <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد إشعارات جديدة حالياً</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  n.read
                    ? 'bg-slate-800/40 border-slate-800 text-slate-300'
                    : 'bg-slate-800/90 border-blue-600/40 text-white shadow-md shadow-blue-950/20'
                }`}
              >
                {!n.read && (
                  <span className="absolute top-3 left-3 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900/70 shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-sm">{n.title}</h4>
                      <span className="text-[11px] text-slate-400 shrink-0 font-latin">{n.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.body}</p>
                    {/* Target tag badge */}
                    {(n.targetGroup || n.targetStudentCode || n.targetGrade) && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {n.targetGroup && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-300 font-semibold">
                            مخصص لـ: {n.targetGroup}
                          </span>
                        )}
                        {n.targetGrade && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                            {n.targetGrade}
                          </span>
                        )}
                        {n.targetStudentCode && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800/60 text-purple-300 font-latin">
                            كود: {n.targetStudentCode}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
