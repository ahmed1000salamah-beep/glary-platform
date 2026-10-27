import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  User, 
  GraduationCap, 
  Send, 
  Trash2, 
  CheckCircle2, 
  Heart, 
  BookOpen, 
  AlertTriangle,
  History,
  Clock,
  Lock,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Student, TeacherNote } from '../../types';
import { storageService } from '../../services/storage';
import { StudentFuzzySearchAutocomplete } from '../common/StudentFuzzySearchAutocomplete';

interface Props {
  students: Student[];
  onStudentsUpdated: (updatedList: Student[]) => void;
  onSendNotificationToast: (title: string, body: string) => void;
  initialSelectedStudentId?: string;
}

export const TeacherNotesManager: React.FC<Props> = ({
  students,
  onStudentsUpdated,
  onSendNotificationToast,
  initialSelectedStudentId
}) => {
  // Step 1: Grade Level Selection
  const gradeLevels = useMemo(() => {
    const list = Array.from(new Set(students.map(s => s.gradeLevel)));
    return list.length > 0 ? list : ['الصف الثالث الثانوي', 'الصف الثاني الثانوي', 'الصف الأول الثانوي'];
  }, [students]);

  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (initialSelectedStudentId) {
      const found = students.find(s => s.id === initialSelectedStudentId);
      if (found) return found.gradeLevel;
    }
    return '';
  });

  // Filter students based on selected grade
  const filteredStudentsByGrade = useMemo(() => {
    return students.filter(s => !selectedGrade || s.gradeLevel === selectedGrade);
  }, [students, selectedGrade]);

  // Step 2: Student Selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialSelectedStudentId) return initialSelectedStudentId;
    return filteredStudentsByGrade[0]?.id || students[0]?.id || '';
  });

  // Current active student
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || filteredStudentsByGrade[0] || students[0] || null;
  }, [students, selectedStudentId, filteredStudentsByGrade]);

  // Step 3: Note Category
  const [noteCategory, setNoteCategory] = useState<TeacherNote['category']>('encouragement');

  // Step 4: Note Content
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick suggestion chips
  const quickSuggestions: Record<TeacherNote['category'], string[]> = {
    encouragement: [
      'ما شاء الله! أداء متميز جداً واستيعاب رائع لقواعد اللغة الإنجليزية، استمر يا بطل.',
      'الدرجة النهائية في كويز اليوم! فخور جداً بتركيزك وتطورك الملحوظ.',
      'إجابات نموذجية وحفظ متقن لكلمات وتعبيرات الوحدة، بارك الله فيك.',
      'مستواك في التعبير والترجمة ممتاز ومنظم للغاية، أحسنت.'
    ],
    academic: [
      'يرجى مراجعة زمن الماضي التام (Past Perfect) وحل تمارين كتاب الشرح صفحة 45.',
      'اهتم بحفظ حروف الجر المصاحبة للأفعال (Dependent Prepositions) للوحدة الحالية.',
      'مستواك في التراجم يحتاج إلى دقة أكبر في اختيار المترادفات، راجع المذكرة جيداً.',
      'ركز على أسئلة مهارات القراءة والاستنتاج في تدريبات كتاب المراجعة.'
    ],
    warning: [
      'تنبيه: عدم إحضار المذكرة أو عدم إكمال الواجب للمرة الثانية، يرجى الالتزام التام.',
      'لوحظ تشتت التركيز في الحصة الأخيرة، نرجو الانتباه الكامل لتحقيق أعلى الدرجات.',
      'غياب غير مبرر عن الكويز الأسبوعي، يرجى التنسيق مع السكرتارية لإعادة الاختبار.',
      'الرجاء تعويض التسميع الفائت في أول حصة قادمة مع مشرف الدفعة.'
    ],
    behavior: [
      'لوحظ التزام ممتاز بالأدب والانضباط داخل القاعة، مثال يحتذى به.',
      'يرجى عدم استخدام الهاتف المحمول أثناء الشرح والتركيز التام مع المستر.'
    ]
  };

  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    const newStudents = newGrade ? students.filter(s => s.gradeLevel === newGrade) : students;
    if (newStudents.length > 0) {
      setSelectedStudentId(newStudents[0].id);
    }
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) {
      alert('يرجى اختيار طالب أولاً عبر البحث أو المقترحات.');
      return;
    }
    if (!noteContent.trim()) {
      alert('يرجى كتابة نص الملاحظة والتوجيه.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = storageService.addNoteToStudent(activeStudent.id, {
        author: 'مستر أحمد المعاطي',
        content: noteContent.trim(),
        category: noteCategory
      });

      if (updated) {
        const freshStudents = storageService.getStudents();
        onStudentsUpdated(freshStudents);
        setNoteContent('');
        onSendNotificationToast(
          'تم حفظ التوجيه وإرساله ✨',
          `تم توجيه الملاحظة بنجاح وحصرياً للطالب (${activeStudent.fullName})، وأصبحت مرئية في حسابه وحساب ولي أمره فقط.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (!activeStudent) return;
    if (confirm('هل أنت متأكد من حذف هذه الملاحظة من سجل الطالب؟')) {
      storageService.deleteNoteFromStudent(activeStudent.id, noteId);
      const freshStudents = storageService.getStudents();
      onStudentsUpdated(freshStudents);
      onSendNotificationToast('تم حذف الملاحظة 🗑️', 'تم إزالة الملاحظة من سجل الطالب بنجاح.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Main Composer Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        <form onSubmit={handleSubmitNote} className="space-y-6">
          
          {/* Section 1: Target Student Selection with Fuzzy Autocomplete Suggestions */}
          <div className="space-y-4 pb-5 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-latin">1</span>
                <span>البحث الذكي وتحديد الطالب المستهدف بالتوجيه</span>
              </div>
              <span className="text-[11px] text-slate-400">
                إجمالي الطلاب المتاحين: {filteredStudentsByGrade.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Optional Grade Filter */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                  <span>تصفية المرحلة الدراسية:</span>
                </label>
                <select
                  value={selectedGrade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none font-cairo"
                >
                  <option value="">جميع المراحل والصفوف</option>
                  {gradeLevels.map((gr) => (
                    <option key={gr} value={gr}>{gr}</option>
                  ))}
                </select>
              </div>

              {/* Autocomplete Search with Live Fuzzy Suggestions */}
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>ابحث بالاسم أو الكود (مقترحات ذكية):</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ✓ يدعم الأخطاء الإملائية والتشابه
                  </span>
                </label>
                <StudentFuzzySearchAutocomplete
                  students={filteredStudentsByGrade.length > 0 ? filteredStudentsByGrade : students}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={(st) => {
                    setSelectedStudentId(st.id);
                    if (st.gradeLevel && st.gradeLevel !== selectedGrade) {
                      setSelectedGrade(st.gradeLevel);
                    }
                  }}
                  placeholder="اكتب اسم الطالب، الكود، أو أقرب مقترح..."
                />
              </div>
            </div>

            {/* Targeted Student Confirmation & Lock Card */}
            {activeStudent && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-950 to-indigo-950/40 border border-blue-500/40 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-md">
                      {activeStudent.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-white">
                          {activeStudent.fullName}
                        </h3>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-900/60 text-blue-200 border border-blue-700/50">
                          كود: {activeStudent.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {activeStudent.gradeLevel} • {activeStudent.groupName} • هاتف الطالب: {activeStudent.phone || 'غير مسجل'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs font-bold shadow-sm">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>توجيه مقفل ومخصص لهذا الطالب حصرياً</span>
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    الخصوصية مؤكدة: لن يظهر هذا التوجيه لأي طالب آخر في المنصة، بل سيصل إلى حساب ({activeStudent.fullName}) وحساب ولي أمره فقط.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Note Category */}
          <div className="space-y-3 pb-5 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-latin">2</span>
              <span>تصنيف ونوع الملاحظة</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: تشجيع وثناء */}
              <button
                type="button"
                onClick={() => setNoteCategory('encouragement')}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  noteCategory === 'encouragement'
                    ? 'bg-emerald-950/50 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-md shadow-emerald-900/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-emerald-400">تشجيع وثناء</span>
                  <Heart className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400">تحفيز للدرجات المرتفعة والاجتهاد الأكاديمي</p>
              </button>

              {/* Option 2: توجيه أكاديمي */}
              <button
                type="button"
                onClick={() => setNoteCategory('academic')}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  noteCategory === 'academic'
                    ? 'bg-blue-950/50 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-md shadow-blue-900/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-blue-400">توجيه أكاديمي</span>
                  <BookOpen className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-[11px] text-slate-400">إرشادات لمذاكرة القواعد، الكلمات، والترجمة</p>
              </button>

              {/* Option 3: تنبيه ومتابعة */}
              <button
                type="button"
                onClick={() => setNoteCategory('warning')}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  noteCategory === 'warning'
                    ? 'bg-rose-950/50 border-rose-500 text-white ring-1 ring-rose-500/50 shadow-md shadow-rose-900/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold text-rose-400">تنبيه ومتابعة</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-[11px] text-slate-400">لتقصير في الواجب، الكويز، أو الحضور</p>
              </button>
            </div>
          </div>

          {/* Section 3: Note Content & Quick Chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center text-xs font-latin">3</span>
                <span>نص الملاحظة والتوجيه</span>
              </div>
              <span className="text-[11px] text-slate-400">اختر من العبارات الجاهزة أو اكتب نصك المخصص</span>
            </div>

            {/* Quick Templates */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {quickSuggestions[noteCategory]?.map((text, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNoteContent(text)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white shrink-0 transition-colors"
                >
                  {text.length > 40 ? text.slice(0, 40) + '...' : text}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={`اكتب التوجيه والملاحظة التربوية الخاصة بالطالب (${activeStudent?.fullName || 'المحدد'}) هنا...`}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors leading-relaxed"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={isSubmitting || !activeStudent}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>إرسال التوجيه للطالب ({activeStudent?.fullName.split(' ')[0] || 'المحدد'}) فوراً</span>
            </button>
          </div>
        </form>
      </div>

      {/* History of notes for this specific active student */}
      {activeStudent && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">
                سجل الملاحظات السابقة للطالب: {activeStudent.fullName}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-latin font-bold">
              {activeStudent.notes?.length || 0} ملاحظة
            </span>
          </div>

          {!activeStudent.notes || activeStudent.notes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800/60">
              لا توجد توجيهات مسجلة لهذا الطالب حتى الآن.
            </div>
          ) : (
            <div className="space-y-3">
              {activeStudent.notes.map((note) => {
                const isEncouragement = note.category === 'encouragement';
                const isWarning = note.category === 'warning';
                return (
                  <div
                    key={note.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isEncouragement
                        ? 'bg-emerald-950/25 border-emerald-800/60'
                        : isWarning
                        ? 'bg-rose-950/25 border-rose-800/60'
                        : 'bg-blue-950/25 border-blue-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isEncouragement
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isWarning
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {isEncouragement ? '🌟 تشجيع وثناء' : isWarning ? '⚠️ تنبيه ومتابعة' : '📚 توجيه أكاديمي'}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-latin">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {note.date}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="حذف هذه الملاحظة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-cairo">
                      {note.content}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>المرسل: {note.author}</span>
                      <span className="text-emerald-400 font-medium">✓ مرئي حصرياً للطالب وولي أمره</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
