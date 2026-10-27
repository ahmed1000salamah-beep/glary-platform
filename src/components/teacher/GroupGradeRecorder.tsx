import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Award, 
  Layers, 
  Users, 
  Search, 
  Save, 
  PlusCircle, 
  FolderOpen, 
  Star, 
  FileText,
  RefreshCw
} from 'lucide-react';
import { Student, ExamRecord } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  role: 'teacher' | 'secretary';
  students: Student[];
  onNotify: (title: string, body: string) => void;
  onStudentsUpdated: () => void;
}

interface StudentGradeRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  phone: string;
  score: string;
  isAbsent: boolean;
  feedback: string;
  existingExamId?: string;
}

export const GroupGradeRecorder: React.FC<Props> = ({
  role,
  students,
  onNotify,
  onStudentsUpdated
}) => {
  // Extract distinct grades
  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.gradeLevel) set.add(s.gradeLevel);
    });
    return Array.from(set);
  }, [students]);

  // Selected Grade state
  const [selectedGrade, setSelectedGrade] = useState<string>(() => availableGrades[0] || 'الصف الثالث الثانوي');

  // Groups available for the selected grade
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    students
      .filter(s => !selectedGrade || s.gradeLevel === selectedGrade)
      .forEach(s => {
        if (s.groupName) set.add(s.groupName);
      });
    return Array.from(set);
  }, [students, selectedGrade]);

  // Selected Group state
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Effective group is selectedGroup if valid for this grade, otherwise the first available
  const effectiveGroup = availableGroups.includes(selectedGroup)
    ? selectedGroup
    : (availableGroups[0] || '');

  // Handle grade change and auto-pick its first group
  const handleGradeChange = (newGrade: string) => {
    setSelectedGrade(newGrade);
    const groupsForGrade = Array.from(new Set(
      students.filter(s => s.gradeLevel === newGrade && s.groupName).map(s => s.groupName)
    ));
    setSelectedGroup(groupsForGrade[0] || '');
  };

  // Mode: 'past' (الامتحانات الفاتت) or 'new' (امتحان جديد)
  const [examMode, setExamMode] = useState<'past' | 'new'>('new');

  // New Exam Form Fields
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamMaxScore, setNewExamMaxScore] = useState<number>(20);
  const [newExamDate, setNewExamDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newExamType, setNewExamType] = useState<ExamRecord['type']>('weekly_quiz');

  // Students in the selected grade and group
  const groupStudents = useMemo(() => {
    return students.filter(s => {
      const matchGrade = !selectedGrade || s.gradeLevel === selectedGrade;
      const matchGroup = !effectiveGroup || s.groupName === effectiveGroup;
      return matchGrade && matchGroup;
    });
  }, [students, selectedGrade, effectiveGroup]);

  // Past Exams for this group
  const pastExamsList = useMemo(() => {
    const map = new Map<string, { title: string; maxScore: number; date: string; type: ExamRecord['type']; count: number }>();
    groupStudents.forEach(st => {
      (st.exams || []).forEach(ex => {
        const existing = map.get(ex.title);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(ex.title, {
            title: ex.title,
            maxScore: ex.maxScore || 20,
            date: ex.date,
            type: ex.type || 'weekly_quiz',
            count: 1
          });
        }
      });
    });
    return Array.from(map.values());
  }, [groupStudents]);

  // Selected Past Exam Title
  const [selectedPastExamTitle, setSelectedPastExamTitle] = useState<string>('');

  const effectivePastExamTitle = pastExamsList.some(e => e.title === selectedPastExamTitle)
    ? selectedPastExamTitle
    : (pastExamsList[0]?.title || '');

  // Students Grade Table State
  const [gradeRows, setGradeRows] = useState<StudentGradeRow[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Active exam title & max score
  const activeExamTitle = examMode === 'past' ? effectivePastExamTitle : newExamTitle;
  const activeExamMaxScore = examMode === 'past' 
    ? (pastExamsList.find(e => e.title === effectivePastExamTitle)?.maxScore || 20)
    : (Number(newExamMaxScore) || 20);

  // Helper to build rows safely
  const buildInitialRows = (
    mode: 'past' | 'new',
    pastTitle: string,
    targetStudents: Student[]
  ): StudentGradeRow[] => {
    if (mode === 'past' && pastTitle) {
      return targetStudents.map(st => {
        const matchingExam = (st.exams || []).find(e => e.title === pastTitle);
        return {
          studentId: st.id,
          studentCode: st.code,
          studentName: st.fullName,
          phone: st.phone,
          score: matchingExam ? String(matchingExam.score) : '',
          isAbsent: Boolean(matchingExam && matchingExam.score === 0 && matchingExam.feedback?.includes('غائب')),
          feedback: matchingExam?.feedback || '',
          existingExamId: matchingExam?.id
        };
      });
    }
    return targetStudents.map(st => ({
      studentId: st.id,
      studentCode: st.code,
      studentName: st.fullName,
      phone: st.phone,
      score: '',
      isAbsent: false,
      feedback: ''
    }));
  };

  // Safe tracking ref to prevent infinite re-renders
  const lastContextKeyRef = useRef('');
  const currentContextKey = `${selectedGrade}__${effectiveGroup}__${examMode}__${effectivePastExamTitle}__${groupStudents.length}`;

  useEffect(() => {
    if (lastContextKeyRef.current === currentContextKey) {
      return;
    }
    lastContextKeyRef.current = currentContextKey;
    setGradeRows(buildInitialRows(examMode, effectivePastExamTitle, groupStudents));
  }, [currentContextKey, examMode, effectivePastExamTitle, groupStudents]);

  // Update a single student row
  const updateRow = (index: number, updates: Partial<StudentGradeRow>) => {
    setGradeRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Quick fill full score
  const handleFillFullScore = () => {
    setGradeRows(prev => prev.map(r => ({
      ...r,
      score: String(activeExamMaxScore),
      isAbsent: false,
      feedback: r.feedback || 'أداء ممتاز والدرجة كاملة ⭐'
    })));
  };

  // Reset scores
  const handleClearScores = () => {
    setGradeRows(prev => prev.map(r => ({
      ...r,
      score: '',
      isAbsent: false,
      feedback: ''
    })));
  };

  // Save all entered grades
  const handleSaveAllGrades = () => {
    const examTitleToSave = activeExamTitle.trim();
    if (!examTitleToSave) {
      alert('يرجى تحديد أو كتابة عنوان الامتحان أولاً.');
      return;
    }

    const filledRows = gradeRows.filter(r => r.score.trim() !== '' || r.isAbsent);
    if (filledRows.length === 0) {
      alert('لم تقم بإدخال درجات لأي طالب حتى الآن.');
      return;
    }

    setIsSaving(true);

    try {
      const currentStudents = storageService.getStudents();
      let updatedCount = 0;

      // Calculate ranks based on entered scores
      const validScoredRows = filledRows
        .filter(r => !r.isAbsent && r.score.trim() !== '')
        .map(r => ({ id: r.studentId, num: parseFloat(r.score) }))
        .sort((a, b) => b.num - a.num);

      const rankMap = new Map<string, number>();
      validScoredRows.forEach((item, idx) => {
        rankMap.set(item.id, idx + 1);
      });

      // Apply updates
      gradeRows.forEach(row => {
        if (row.score.trim() === '' && !row.isAbsent) return;

        const student = currentStudents.find(s => s.id === row.studentId);
        if (!student) return;

        const scoreNum = row.isAbsent ? 0 : parseFloat(row.score) || 0;
        const rank = rankMap.get(row.studentId) || (row.isAbsent ? groupStudents.length : 1);
        const feedbackText = row.isAbsent 
          ? (row.feedback || 'غائب عن أداء الاختبار - يرجى المتابعة') 
          : row.feedback;

        const examRecord: ExamRecord = {
          id: row.existingExamId || `exam-${Date.now()}-${row.studentCode}`,
          title: examTitleToSave,
          date: examMode === 'past' 
            ? (pastExamsList.find(e => e.title === effectivePastExamTitle)?.date || new Date().toISOString().split('T')[0])
            : newExamDate,
          score: scoreNum,
          maxScore: activeExamMaxScore,
          percentage: Math.round((scoreNum / activeExamMaxScore) * 100),
          gradeRank: rank,
          totalStudents: groupStudents.length,
          feedback: feedbackText,
          type: examMode === 'past'
            ? (pastExamsList.find(e => e.title === effectivePastExamTitle)?.type || 'weekly_quiz')
            : newExamType
        };

        student.exams = student.exams || [];
        const existingIdx = student.exams.findIndex(e => e.title === examTitleToSave || e.id === row.existingExamId);

        if (existingIdx >= 0) {
          student.exams[existingIdx] = examRecord;
        } else {
          student.exams.unshift(examRecord);
        }

        storageService.updateStudent(student);
        updatedCount++;
      });

      // Broadcast notification
      storageService.addNotification({
        title: `📊 رصد درجات: ${examTitleToSave}`,
        body: `تم رصد درجات ${examTitleToSave} لطلاب ${effectiveGroup} بواسطة ${role === 'teacher' ? 'مستر أحمد' : 'السكرتارية'}.`,
        targetRole: 'all',
        targetGrade: selectedGrade,
        targetGroup: effectiveGroup,
        type: 'grade'
      });

      // Reset ref so next update can re-sync if needed
      lastContextKeyRef.current = '';

      onStudentsUpdated();
      setIsSaving(false);

      onNotify(
        'تم حفظ الدرجات بنجاح ⭐',
        `تم رصد وتحديث درجات (${updatedCount}) طالب في ${effectiveGroup} بنجاح وإرسال إشعار فوري لأولياء الأمور.`
      );
    } catch (err) {
      setIsSaving(false);
      alert('حدث خطأ أثناء حفظ الدرجات. يرجى المحاولة مرة أخرى.');
    }
  };

  // Filtered rows for display
  const displayedRows = gradeRows.filter(r => 
    r.studentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.studentCode.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Group Stats
  const filledCount = gradeRows.filter(r => r.score.trim() !== '' && !r.isAbsent).length;
  const absentCount = gradeRows.filter(r => r.isAbsent).length;
  const averageScore = filledCount > 0
    ? (gradeRows.filter(r => !r.isAbsent && r.score.trim() !== '').reduce((acc, r) => acc + (parseFloat(r.score) || 0), 0) / filledCount).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* --- Step 1: Grade & Group Selectors Bar --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>رصد وتعديل درجات المجموعات والامتحانات</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300 font-bold">
                خطوة 1: تحديد الصف والمجموعة
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              حدد المرحلة والمجموعة، ثم اختر إما امتحاناً سابقاً لتعديل درجاته، أو أنشئ امتحاناً جديداً لرصده للطلاب دفعة واحدة.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Grade Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>الصف الدراسي:</span>
              <span className="text-[10px] text-blue-400 font-bold">({availableGrades.length} مراحل متاحة)</span>
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
            >
              {availableGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* 2. Group Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span>المجموعة ومواعيد الحصص:</span>
              <span className="text-[10px] text-emerald-400 font-bold">({availableGroups.length} مجموعات)</span>
            </label>
            <select
              value={effectiveGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
            >
              {availableGroups.map((grp) => (
                <option key={grp} value={grp}>{grp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* --- Step 2: Past Exams vs New Exam Mode --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>خطوة 2: اختيار الامتحان (سابق أو جديد)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              اختر "الامتحانات السابقة" لمراجعة وتعديل الدرجات المسجلة، أو "امتحان جديد" لرصد كويز/امتحان جديد.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setExamMode('new')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                examMode === 'new'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>امتحان جديد</span>
            </button>

            <button
              type="button"
              onClick={() => setExamMode('past')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                examMode === 'past'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>الامتحانات السابقة ({pastExamsList.length})</span>
            </button>
          </div>
        </div>

        {/* --- IF NEW EXAM MODE --- */}
        {examMode === 'new' && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                عنوان الكويز أو الامتحان الجديد:
              </label>
              <input
                type="text"
                value={newExamTitle}
                onChange={(e) => setNewExamTitle(e.target.value)}
                placeholder="مثال: كويز المحاضرة 4 (Past Perfect & Modals)"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                الدرجة العظمى (من كام):
              </label>
              <input
                type="number"
                min={1}
                value={newExamMaxScore}
                onChange={(e) => setNewExamMaxScore(Number(e.target.value))}
                placeholder="20"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-latin focus:outline-none focus:border-blue-500 text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                تاريخ الامتحان:
              </label>
              <input
                type="date"
                value={newExamDate}
                onChange={(e) => setNewExamDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-latin focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* --- IF PAST EXAMS MODE --- */}
        {examMode === 'past' && (
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            {pastExamsList.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold text-slate-300">لم يتم تسجيل أي امتحانات سابقة لهذه المجموعة بعد.</p>
                <p className="text-[11px] text-slate-500 mt-1">اختر تبويب "امتحان جديد" في الأعلى لإضافة أول امتحان لهذه المجموعة.</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  اختر من الامتحانات التي سبق أداؤها لعرض وتعديل درجات الطلاب:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {pastExamsList.map((pe) => (
                    <button
                      key={pe.title}
                      type="button"
                      onClick={() => setSelectedPastExamTitle(pe.title)}
                      className={`p-3.5 rounded-2xl text-right transition-all border ${
                        effectivePastExamTitle === pe.title
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-latin">
                        <span>{pe.date}</span>
                        <span className="text-amber-400 font-bold">من {pe.maxScore} درجة</span>
                      </div>
                      <div className="font-bold text-xs text-white truncate">{pe.title}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-latin">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span>مسجل لـ {pe.count} طالب</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Step 3: Students Table for Entering & Editing Grades --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Table Header Controls & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>طلاب {effectiveGroup} ({groupStudents.length} طالب)</span>
              {activeExamTitle && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  {activeExamTitle} (من {activeExamMaxScore})
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              يمكنك كتابة درجة كل طالب مباشرة، وضع علامة "غائب"، وكتابة ملاحظة شخصية لولي الأمر.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium">
              تم رصدهم: <strong className="text-emerald-400 font-latin">{filledCount}</strong> / {groupStudents.length}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium">
              الغياب: <strong className="text-rose-400 font-latin">{absentCount}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium">
              المتوسط: <strong className="text-amber-400 font-latin">{averageScore}</strong>
            </span>
          </div>
        </div>

        {/* Action bar above table */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="بحث في طلاب المجموعة بالاسم أو الكود..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleFillFullScore}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>الدرجة الكاملة للكل ({activeExamMaxScore})</span>
            </button>

            <button
              type="button"
              onClick={handleClearScores}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors"
            >
              تفريغ الحقول
            </button>

            <button
              type="button"
              onClick={handleSaveAllGrades}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>حفظ ورصد درجات المجموعة</span>
            </button>
          </div>
        </div>

        {/* The Students Sheet Table */}
        {groupStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs font-semibold text-slate-300">لا يوجد طلاب مسجلين في هذه المجموعة حالياً.</p>
            <p className="text-[11px] text-slate-500 mt-1">يرجى تسجيل طلاب أو اختيار مرحلة ومجموعة أخرى من القائمة أعلاه.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3 w-10 text-center">#</th>
                  <th className="p-3">كود الطالب</th>
                  <th className="p-3">اسم الطالب</th>
                  <th className="p-3 w-40 text-center">الدرجة المحصلة</th>
                  <th className="p-3 w-28 text-center">النسبة والتقدير</th>
                  <th className="p-3">ملاحظة المعلم لولي الأمر</th>
                  <th className="p-3 w-20 text-center">حالة الحضور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedRows.map((row, idx) => {
                  const scoreVal = parseFloat(row.score);
                  const hasValidScore = !isNaN(scoreVal) && row.score.trim() !== '' && !row.isAbsent;
                  const pct = hasValidScore ? Math.round((scoreVal / activeExamMaxScore) * 100) : null;

                  return (
                    <tr 
                      key={row.studentId} 
                      className={`hover:bg-slate-900/50 transition-colors ${
                        row.isAbsent ? 'bg-rose-950/15' : hasValidScore ? 'bg-blue-950/10' : ''
                      }`}
                    >
                      {/* # */}
                      <td className="p-3 text-center text-slate-500 font-latin">{idx + 1}</td>

                      {/* Code */}
                      <td className="p-3 font-mono font-bold text-white font-latin whitespace-nowrap">
                        {row.studentCode}
                      </td>

                      {/* Name */}
                      <td className="p-3 font-bold text-white whitespace-nowrap">
                        {row.studentName}
                      </td>

                      {/* Score Input */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={activeExamMaxScore}
                            value={row.isAbsent ? '' : row.score}
                            disabled={row.isAbsent}
                            onChange={(e) => updateRow(idx, { score: e.target.value, isAbsent: false })}
                            placeholder={row.isAbsent ? 'غائب' : '0.0'}
                            className={`w-20 px-2.5 py-1.5 rounded-xl border text-center font-bold text-xs sm:text-sm font-latin focus:outline-none transition-all ${
                              row.isAbsent
                                ? 'bg-rose-950/40 border-rose-800 text-rose-300 placeholder-rose-400'
                                : hasValidScore
                                ? 'bg-slate-900 border-blue-500/80 text-white focus:ring-1 focus:ring-blue-500'
                                : 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-blue-500'
                            }`}
                          />
                          <span className="text-slate-400 font-latin text-[11px]">/ {activeExamMaxScore}</span>
                        </div>
                      </td>

                      {/* Percentage & Appreciation */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {row.isAbsent ? (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-400 font-bold text-[10px]">
                            غائب
                          </span>
                        ) : pct !== null ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold font-latin text-white text-xs">{pct}%</span>
                            <span className={`text-[10px] font-bold ${
                              pct >= 90 ? 'text-emerald-400' : pct >= 80 ? 'text-blue-400' : pct >= 65 ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {pct >= 90 ? 'ممتاز ⭐' : pct >= 80 ? 'جيد جداً' : pct >= 65 ? 'جيد' : 'يحتاج تدريب'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Feedback Note */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={row.feedback}
                          onChange={(e) => updateRow(idx, { feedback: e.target.value })}
                          placeholder="ملاحظة سريعة لولي الأمر..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                      </td>

                      {/* Absent Toggle */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (row.isAbsent) {
                              updateRow(idx, { isAbsent: false, feedback: '' });
                            } else {
                              updateRow(idx, { isAbsent: true, score: '0', feedback: 'غائب عن الامتحان الأسبوعي' });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            row.isAbsent
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300'
                          }`}
                          title={row.isAbsent ? 'إلغاء الغياب' : 'تسجيل غياب الطالب عن الامتحان'}
                        >
                          {row.isAbsent ? 'غائب ✕' : 'تسجيل غياب'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            * عند الضغط على <strong className="text-emerald-400">حفظ ورصد درجات المجموعة</strong> سيتم إدراج النتيجة تلقائياً في سجل كل طالب وإرسال إشعار فوري لولي أمره.
          </div>

          <button
            type="button"
            onClick={handleSaveAllGrades}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all self-end sm:self-auto"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ ورصد درجات المجموعة بالكامل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
