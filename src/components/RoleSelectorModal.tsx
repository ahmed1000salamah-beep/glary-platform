import React from 'react';
import { Users, GraduationCap } from 'lucide-react';
import { storageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onSelectRole: (role: 'student' | 'parent') => void;
  onOpenStaffModal?: () => void;
  onOpenPWAInstall?: () => void;
  onOpenStandaloneTeacherApp?: () => void;
}

export const RoleSelectorModal: React.FC<Props> = ({
  isOpen,
  onSelectRole,
}) => {
  const teacherPhoto = storageService.getTeacherPhoto();
  const [imgFailed, setImgFailed] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto font-cairo">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 relative">
        
        {/* Brand Header: Teacher Photo + Platform Name */}
        <div className="text-center mb-6">
          <div className="inline-block relative mb-3">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-blue-500 shadow-xl shadow-blue-900/30 mx-auto overflow-hidden flex items-center justify-center">
              {!imgFailed && teacherPhoto ? (
                <img
                  src={teacherPhoto}
                  alt="مستر أحمد المعاطي"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-amber-400 font-black text-2xl border border-amber-500/40 shadow-inner">
                  <span>أ</span>
                </div>
              )}
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            منصة جلري التعليمية
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            مستر أحمد المعاطي • خبير تدريس اللغة الإنجليزية
          </p>
        </div>

        {/* Big Cards: Student or Parent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Student Card */}
          <button
            onClick={() => onSelectRole('student')}
            className="p-5 rounded-2xl border-2 border-slate-700 hover:border-blue-500 bg-gradient-to-b from-slate-800/90 to-slate-850 hover:from-slate-800 hover:to-blue-950/40 transition-all text-right group shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors mb-1">
                أنا طالب (Student)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                حل الكويزات التفاعلية، مشاهدة فيديوهات الشرح المحمية، متابعة درجات الامتحانات والواجبات.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-bold text-blue-400">
              <span>دخول بوابة الطالب</span>
              <span className="font-latin text-base group-hover:-translate-x-1 transition-transform">←</span>
            </div>
          </button>

          {/* Parent Card */}
          <button
            onClick={() => onSelectRole('parent')}
            className="p-5 rounded-2xl border-2 border-slate-700 hover:border-emerald-500 bg-gradient-to-b from-slate-800/90 to-slate-850 hover:from-slate-800 hover:to-emerald-950/40 transition-all text-right group shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors mb-1">
                أنا ولي أمر (Parent)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                متابعة دقيقة لدرجات الامتحانات، سجل الحضور والغياب، التزام الواجبات، وملاحظات مستر أحمد الخاصة.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>دخول بوابة ولي الأمر</span>
              <span className="font-latin text-base group-hover:-translate-x-1 transition-transform">←</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
