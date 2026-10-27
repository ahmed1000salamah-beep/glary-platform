import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  User, 
  GraduationCap, 
  Phone, 
  MapPin, 
  Key, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Clock,
  Sparkles
} from 'lucide-react';
import { Student } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSuccess: (updatedStudent: Student) => void;
  onSendNotificationToast: (title: string, body: string) => void;
}

export const EditStudentModal: React.FC<Props> = ({
  isOpen,
  student,
  onClose,
  onSuccess,
  onSendNotificationToast
}) => {
  // Dynamically fetch created groups from teacher system
  const teacherGroups = storageService.getGroups();

  const dynamicStageOptions = Array.from(
    new Set([
      ...teacherGroups.map((g) => g.gradeLevel).filter(Boolean),
      'الصف الثالث الثانوي (General Secondary)',
      'الصف الثالث الثانوي',
      'الصف الثاني الثانوي',
      'الصف الأول الثانوي',
      'الصف الثالث الإعدادي',
      'الصف الثاني الإعدادي',
      'الصف الأول الإعدادي'
    ])
  );

  const dynamicGroupOptions = Array.from(
    new Set([
      ...teacherGroups.map((g) => `${g.name} (${g.location}) - ${g.schedule}`),
      ...teacherGroups.map((g) => g.name),
      'مجموعة السبت والثلاثاء (4:00 م)',
      'مجموعة السبت والثلاثاء (6:30 م)',
      'مجموعة الأحد والأربعاء (3:00 م)',
      'مجموعة الأحد والأربعاء (5:00 م)',
      'مجموعة الإثنين والخميس (4:00 م)',
      'مجموعة الإثنين والخميس (6:00 م)',
      'مجموعة النخبة الخاصة'
    ])
  );

  const [fullName, setFullName] = useState('');
  const [code, setCode] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [groupName, setGroupName] = useState('');
  const [branch, setBranch] = useState<'دمياط' | 'كفر سعد'>('دمياط');
  const [age, setAge] = useState<number>(17);
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName || '');
      setCode(student.code || '');
      setGradeLevel(student.gradeLevel || dynamicStageOptions[0]);
      setGroupName(student.groupName || dynamicGroupOptions[0]);
      setBranch(student.branch === 'كفر سعد' ? 'كفر سعد' : 'دمياط');
      setAge(student.age || (student.gradeLevel?.includes('الثالث الثانوي') ? 18 : 17));
      setPhone(student.phone || '');
      setParentPhone(student.parentPhone || '');
      setFatherName(student.fatherName || '');
      setPassword(student.password || '123456');
      setError(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanName) {
      setError('يرجى إدخال اسم الطالب كاملاً');
      return;
    }

    if (!cleanCode) {
      setError('يرجى إدخال كود الطالب');
      return;
    }

    // Check if code was changed and already exists for another student
    if (cleanCode !== student.code.toUpperCase()) {
      const existing = storageService.getStudentByCode(cleanCode);
      if (existing && existing.id !== student.id) {
        setError(`كود الطالب "${cleanCode}" مسجل بالفعل لطالب آخر (${existing.fullName})`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updatedStudent: Student = {
        ...student,
        fullName: cleanName,
        code: cleanCode,
        gradeLevel,
        groupName,
        branch,
        age: Number(age) || 17,
        phone: phone.trim(),
        parentPhone: parentPhone.trim(),
        fatherName: fatherName.trim() || undefined,
        password: password.trim() || '123456'
      };

      storageService.updateStudent(updatedStudent);

      onSendNotificationToast(
        'تم تحديث بيانات الطالب بنجاح ✏️',
        `تم حفظ التعديلات لـ ${updatedStudent.fullName} (كود: ${updatedStudent.code}) في قاعدة بيانات المنصة.`
      );

      onSuccess(updatedStudent);
      onClose();
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 text-right my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>تعديل بيانات الطالب</span>
                <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 font-mono font-latin">
                  {student.code}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تعديل الاسم والمرحلة، كود السنتر، أرقام التواصل، وكلمة المرور
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

        {/* Error notification if any */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 py-4 space-y-4 pr-1 pl-1">
          {/* Row 1: Full Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم الطالب بالكامل <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: عمر خالد عبد العزيز"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-semibold"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كود السنتر <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="STD-101"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2.5 text-xs sm:text-sm text-blue-300 font-mono font-bold focus:outline-none focus:border-blue-500 font-latin text-left dir-ltr"
                />
                <Hash className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          {/* Row 2: Grade Level & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المرحلة الدراسية <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 appearance-none font-medium"
                >
                  {dynamicStageOptions.map((stg) => (
                    <option key={stg} value={stg} className="bg-slate-900 text-white">
                      {stg}
                    </option>
                  ))}
                </select>
                <GraduationCap className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                فرع السنتر <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value as 'دمياط' | 'كفر سعد')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 appearance-none font-medium"
                >
                  <option value="دمياط" className="bg-slate-900 text-white">سنتر دمياط</option>
                  <option value="كفر سعد" className="bg-slate-900 text-white">سنتر كفر سعد</option>
                </select>
                <MapPin className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Group Schedule & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                المجموعة وموعد الحصة الأسبوعي
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="مجموعة الأحد والأربعاء (5:00 م)"
                  list="group-presets"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                />
                <Clock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                <datalist id="group-presets">
                  {dynamicGroupOptions.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                سن الطالب (بالسنوات)
              </label>
              <input
                type="number"
                min="12"
                max="25"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-bold font-latin"
              />
            </div>
          </div>

          {/* Row 4: Phones (Student & Parent) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم هاتف الطالب (واتساب)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-latin text-left dir-ltr"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رقم هاتف ولي الأمر (لإرسال التقارير والإيصالات)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="01098765432"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 font-latin text-left dir-ltr font-bold"
                />
                <Phone className="w-4 h-4 text-emerald-500 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Row 5: Guardian Name & Student Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم ولي الأمر (الأب / الأم)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="مثال: أ. خالد عبد العزيز"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                />
                <Users className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة مرور الطالب للدخول (الباسورد)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-amber-300 font-mono focus:outline-none focus:border-amber-500 font-bold font-latin"
                />
                <Key className="w-4 h-4 text-amber-500 absolute right-3.5 top-3" />
              </div>
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-blue-900/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات 💾'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
