import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CreditCard, 
  User, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  MapPin, 
  GraduationCap, 
  Wifi, 
  RotateCw,
  Info
} from 'lucide-react';
import { StudentGroup, Student } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  group: StudentGroup;
  onStudentAdded: (student: Student) => void;
}

export const AddStudentWithNfcModal: React.FC<Props> = ({
  isOpen,
  onClose,
  group,
  onStudentAdded
}) => {
  // NFC Card Reader State
  const [nfcCode, setNfcCode] = useState('');
  const [isNfcScanned, setIsNfcScanned] = useState(false);
  const [isReadingNfc, setIsReadingNfc] = useState(false);
  const [nfcError, setNfcError] = useState('');
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Student Form State
  const [customCode, setCustomCode] = useState('');
  const [password, setPassword] = useState('123456');
  const [fullName, setFullName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [gradeLevel, setGradeLevel] = useState(group.gradeLevel || 'الصف الثالث الثانوي');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teacherGroups = storageService.getGroups();
  const dynamicGrades = Array.from(
    new Set([
      group.gradeLevel,
      ...teacherGroups.map((g) => g.gradeLevel).filter(Boolean),
      'الصف الثالث الثانوي',
      'الصف الثاني الثانوي',
      'الصف الأول الثانوي',
      'الصف الثالث الإعدادي',
      'الصف الثاني الإعدادي',
      'الصف الأول الإعدادي'
    ])
  );

  // Focus NFC reader input on modal open
  useEffect(() => {
    if (isOpen) {
      setNfcCode('');
      setIsNfcScanned(false);
      setCustomCode('');
      setPassword('123456');
      setFullName('');
      setStudentPhone('');
      setParentPhone('');
      setNotes('');
      setSubmitError('');
      setNfcError('');
      setGradeLevel(group.gradeLevel || 'الصف الثالث الثانوي');

      setTimeout(() => {
        cardInputRef.current?.focus();
      }, 200);

      // Start Web NFC listener if supported
      startWebNfcListener();
    }
  }, [isOpen, group]);

  const startWebNfcListener = async () => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        setIsReadingNfc(true);
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();
        ndef.onreading = (event: any) => {
          const serial = event.serialNumber || `NFC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          handleNfcCardDetected(serial);
        };
      } catch (err: any) {
        console.warn('Web NFC not available or permission denied:', err);
        setIsReadingNfc(false);
      }
    }
  };

  const handleNfcCardDetected = (cardUid: string) => {
    const cleanUid = cardUid.trim().toUpperCase();
    if (!cleanUid) return;

    // Check if card is already registered to another student
    const existing = storageService.findStudentByNfcCard(cleanUid);
    if (existing) {
      setNfcError(`تنبيه: هذا الكارت مسجل بالفعل للطالب (${existing.fullName}) في مجموعة (${existing.groupName || 'أخرى'}).`);
      return;
    }

    setNfcError('');
    setNfcCode(cleanUid);
    setIsNfcScanned(true);

    // Audio cue
    playBeepSound();
  };

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch check-in beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {}
  };

  // Simulate NFC Tap for devices without native RFID hardware
  const handleSimulateNfcTap = () => {
    const randomHex = Array.from({ length: 4 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    ).join(':');
    handleNfcCardDetected(`NFC-${randomHex}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const cleanNfc = nfcCode.trim().toUpperCase();
    const cleanCustomCode = customCode.trim().toUpperCase();

    if (!cleanNfc && !cleanCustomCode) {
      setSubmitError('يرجى إدخال الكود المكتوب على الكارت أو مسح كارت NFC لإتمام الإضافة.');
      return;
    }

    if (!fullName.trim()) {
      setSubmitError('يرجى كتابة اسم الطالب بالكامل.');
      return;
    }

    if (!studentPhone.trim() && !parentPhone.trim()) {
      setSubmitError('يرجى إدخال رقم هاتف الطالب أو رقم ولي الأمر على الأقل.');
      return;
    }

    setIsSubmitting(true);

    try {
      const studentId = `std-${Date.now()}`;
      const finalNfcCode = cleanNfc || cleanCustomCode;
      const finalStudentCode = cleanCustomCode || cleanNfc || `STD-${Math.floor(1000 + Math.random() * 9000)}`;
      const finalPassword = password.trim() || '123456';

      const newStudent: Student = {
        id: studentId,
        code: finalStudentCode,
        password: finalPassword,
        fullName: fullName.trim(),
        gradeLevel: gradeLevel.trim(),
        groupName: group.name,
        branch: group.location,
        nfcCardCode: finalNfcCode,
        phone: studentPhone.trim() || parentPhone.trim(),
        parentPhone: parentPhone.trim() || undefined,
        attendance: [],
        exams: [],
        payments: [],
        notes: notes.trim() ? [{
          id: `note-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          author: 'السكرتارية الإدارية',
          content: notes.trim(),
          category: 'academic'
        }] : [],
        activeHomework: []
      };

      // Save student
      storageService.addStudent(newStudent);
      onStudentAdded(newStudent);

      // Dispatch events for live updates across app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glary_student_added', { detail: { student: newStudent } }));
        window.dispatchEvent(new Event('glary_storage_changed'));
      }

      onClose();
    } catch (err: any) {
      setSubmitError('حدث خطأ أثناء حفظ الطالب: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-cairo" dir="rtl">
      <div className="w-full max-w-xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">إضافة طالب جديد للمجموعة (بربط كارت NFC)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مجموعة: <strong className="text-indigo-300">{group.name}</strong> ({group.location})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

          {/* Mandatory Step: NFC Card Reader Panel */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isNfcScanned 
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/40' 
              : 'bg-indigo-950/30 border-indigo-700/50'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  isNfcScanned ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400 animate-ping'
                }`} />
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-indigo-400" />
                  <span>خطوة إلزامية: مسح كارت NFC الخاص بالطالب</span>
                </h4>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                isNfcScanned 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {isNfcScanned ? 'تم قراءة الكارت بنجاح ✅' : 'بانتظار تمرير الكارت...'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              ضع كارت NFC الذكي على قارئ الكروت الموصول بالجهاز (أو خلف الهاتف إن كان يدعم NFC)، وسيتم التقاط الكود تلقائياً وربطه بحساب الطالب للدخول للمنصة.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  ref={cardInputRef}
                  type="text"
                  value={nfcCode}
                  onChange={(e) => handleNfcCardDetected(e.target.value)}
                  placeholder="مرر الكارت على القارئ أو اكتب كود الكارت هنا..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 pl-10"
                />
                <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>

              {/* Simulation button if testing on PC without physical USB RFID reader */}
              <button
                type="button"
                onClick={handleSimulateNfcTap}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                <span>محاكاة قراءة كارت NFC 📲</span>
              </button>
            </div>

            {nfcError && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/50 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{nfcError}</span>
              </div>
            )}
          </div>

          {/* Student Information Fields */}
          <div className="space-y-4">
            {/* Custom Code and Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>كود الطالب المعتمد للمنصة:</span>
                  <span className="text-[10px] text-slate-400 font-normal">(إن ترك فارغاً يحفظ كود الكارت)</span>
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder={nfcCode ? nfcCode : 'مثال: STD-1020 أو كود الكارت'}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>كلمة مرور الحساب (الباسورد):</span>
                  <span className="text-[10px] text-emerald-400 font-bold">(الافتراضي: 123456)</span>
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم الطالب بالكامل (ثلاثي أو رباعي): <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: يوسف أحمد محمد المهدي"
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم هاتف الطالب (واتساب): <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-latin focus:outline-none focus:border-indigo-500"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم هاتف ولي الأمر (لإشعارات الحضور والواجب): <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="011XXXXXXXX"
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-latin focus:outline-none focus:border-indigo-500"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  المرحلة الدراسية / الصف:
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {dynamicGrades.map((grd) => (
                    <option key={grd} value={grd} className="bg-slate-900 text-white">
                      {grd}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  المقر والمجموعة المحددة:
                </label>
                <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
                  <span className="font-bold text-white">{group.name}</span>
                  <span className="text-indigo-400 font-semibold">{group.location}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ملاحظات إضافية عن الطالب (اختياري):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أية ملاحظات خاصة بسلوك الطالب، مستواه الأكاديمي، أو اتفاقات خاصة بسداد المصروفات..."
                rows={2}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !nfcCode.trim()}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2 ${
                !nfcCode.trim() 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'جارٍ الحفظ والربط...' : 'إضافة الطالب وتفعيل الكارت'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
