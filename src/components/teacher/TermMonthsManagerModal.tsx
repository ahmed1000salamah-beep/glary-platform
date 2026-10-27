import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Plus, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Layers
} from 'lucide-react';
import { storageService, DEFAULT_TERM_MONTHS } from '../../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMonthsUpdated: (months: string[]) => void;
  onSendNotificationToast: (title: string, body: string) => void;
}

export const TermMonthsManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onMonthsUpdated,
  onSendNotificationToast
}) => {
  const [months, setMonths] = useState<string[]>(() => storageService.getTermMonths());
  const [newMonthInput, setNewMonthInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMonth = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMonthInput.trim();
    if (!clean) {
      setError('يرجى كتابة اسم الشهر أو الفترة الدراسية');
      return;
    }

    if (months.includes(clean)) {
      setError(`الشهر "${clean}" مضاف بالفعل في قائمة الترم`);
      return;
    }

    const updated = [...months, clean];
    storageService.setTermMonths(updated);
    setMonths(updated);
    setNewMonthInput('');
    setError(null);

    onMonthsUpdated(updated);
    onSendNotificationToast(
      'تمت إضافة شهر جديد للترم 🗓️',
      `تمت إضافة "${clean}" إلى قائمة شهور وسجلات الدفع بنجاح.`
    );
  };

  const handleDeleteMonth = (monthToDelete: string) => {
    if (months.length <= 1) {
      setError('يجب الإبقاء على شهر واحد على الأقل في الترم الدراسي');
      return;
    }

    const updated = months.filter(m => m !== monthToDelete);
    storageService.setTermMonths(updated);
    setMonths(updated);
    setError(null);

    onMonthsUpdated(updated);
    onSendNotificationToast(
      'تم حذف الشهر من الترم 🗑️',
      `تم استبعاد "${monthToDelete}" من قائمة الشهور النشطة للترم.`
    );
  };

  const handleApplyPreset = (preset: 'term1' | 'term2' | 'fullYear') => {
    let presetMonths: string[] = [];
    let title = '';

    if (preset === 'term1') {
      presetMonths = [
        'شهر سبتمبر (بداية الترم)',
        'شهر أكتوبر',
        'شهر نوفمبر',
        'شهر ديسمبر',
        'شهر يناير (امتحانات نصف العام)'
      ];
      title = 'أشهر الترم الأول';
    } else if (preset === 'term2') {
      presetMonths = [
        'شهر فبراير (بداية الترم الثاني)',
        'شهر مارس',
        'شهر أبريل',
        'شهر مايو',
        'شهر يونيو (المراجعة النهائية والامتحانات)'
      ];
      title = 'أشهر الترم الثاني';
    } else {
      presetMonths = [...DEFAULT_TERM_MONTHS];
      title = 'العام الدراسي بالكامل';
    }

    storageService.setTermMonths(presetMonths);
    setMonths(presetMonths);
    setError(null);
    onMonthsUpdated(presetMonths);

    onSendNotificationToast(
      'تم تطبيق نموذج الشهور 🗓️',
      `تم ضبط القائمة على (${title}) بنجاح.`
    );
  };

  const handleResetDefaults = () => {
    const defaults = storageService.resetTermMonths();
    setMonths(defaults);
    setError(null);
    onMonthsUpdated(defaults);

    onSendNotificationToast(
      'استعادة الشهور الافتراضية 🔄',
      'تمت استعادة شهور الترم الافتراضية بنجاح.'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 text-right max-h-[92vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>تخصيص أشهر الترم الدراسي</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800/80 text-amber-300 font-bold">
                  خاص بالمعلم
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                أضف أو احذف شهور وكورسات الترم حسب خطتك التعليمية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Add New Month Form */}
        <form onSubmit={handleAddMonth} className="mt-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span>إضافة شهر أو كورس جديد للترم:</span>
            <span className="text-[11px] text-slate-400">مثال: شهر أكتوبر، كورس المراجعة الشتوية</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMonthInput}
              onChange={(e) => setNewMonthInput(e.target.value)}
              placeholder="اكتب اسم الشهر (مثال: شهر أكتوبر 2026)..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة للترم ➕</span>
            </button>
          </div>
        </form>

        {/* Quick Presets */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400">نماذج سريعة:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset('term1')}
            className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-300 text-[11px] font-bold transition-colors"
          >
            الترم الأول (أكتوبر - يناير)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('term2')}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-bold transition-colors"
          >
            الترم الثاني (فبراير - يونيو)
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>الافتراضي</span>
          </button>
        </div>

        {/* Current Months List */}
        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>شهور الترم المسجلة حالياً ({months.length} شهر):</span>
            </span>
            <span className="text-[11px] text-slate-500">تظهر تلقائياً في شبكة سداد الطلاب</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {months.map((m, idx) => (
              <div
                key={m}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold font-latin flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {m}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteMonth(m)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title={`حذف "${m}" من الترم`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            أي شهر تقوم بإضافته يظهر فوراً في جدول سداد كل الطلاب
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-black transition-colors"
          >
            تم الانتهاء ✓
          </button>
        </div>
      </div>
    </div>
  );
};
