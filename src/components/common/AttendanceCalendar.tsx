import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle,
  PlusCircle,
  Edit3,
  Trash2,
  Save,
  X,
  BookOpen,
  Award,
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus, HomeworkStatus } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  student: Student;
  canEdit?: boolean;
  onAttendanceUpdated?: () => void;
  onSendNotificationToast?: (title: string, body: string) => void;
}

const MONTH_NAMES_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const WEEKDAYS_AR = [
  'السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'
];

export const AttendanceCalendar: React.FC<Props> = ({
  student,
  canEdit = false,
  onAttendanceUpdated,
  onSendNotificationToast
}) => {
  // Calendar month state
  const [currentDate, setCurrentDate] = useState(() => {
    // If student has attendance, default to month of latest attendance, otherwise current date
    if (student.attendance && student.attendance.length > 0) {
      const sorted = [...student.attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = new Date(sorted[0].date);
      if (!isNaN(latest.getTime())) {
        return new Date(latest.getFullYear(), latest.getMonth(), 1);
      }
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Selected date on calendar (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date().toISOString().split('T')[0];
    const hasToday = student.attendance?.find(a => a.date === today);
    if (hasToday) return today;
    if (student.attendance && student.attendance.length > 0) {
      return student.attendance[0].date;
    }
    return today;
  });

  // Modal / Inline Edit form for recording attendance
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Record Form Fields
  const [formDate, setFormDate] = useState<string>(selectedDateStr);
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('present');
  const [formLectureTitle, setFormLectureTitle] = useState('');
  const [formHwStatus, setFormHwStatus] = useState<HomeworkStatus>('completed');
  const [formVocabScore, setFormVocabScore] = useState<number>(20);
  const [formVocabMaxScore, setFormVocabMaxScore] = useState<number>(20);
  const [formEntryTime, setFormEntryTime] = useState<string>('05:00 م');
  const [formNotes, setFormNotes] = useState<string>('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Map attendance by date string for O(1) lookup
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    student.attendance?.forEach((record) => {
      map.set(record.date, record);
    });
    return map;
  }, [student.attendance]);

  // Navigate Months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    // Days in current month
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    // First day of current month (0: Sunday, 1: Monday, ... 6: Saturday)
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // In our week starting Saturday:
    // Saturday = 0, Sunday = 1, Monday = 2, Tuesday = 3, Wednesday = 4, Thursday = 5, Friday = 6
    // JS getDay(): Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6
    // Shift so Saturday is index 0:
    const startOffset = (firstDayIndex + 1) % 7;

    const days: Array<{
      dayNumber: number;
      dateString: string;
      isCurrentMonth: boolean;
      record?: AttendanceRecord;
    }> = [];

    // Empty padding slots before first day
    for (let i = 0; i < startOffset; i++) {
      days.push({
        dayNumber: 0,
        dateString: '',
        isCurrentMonth: false
      });
    }

    // Actual days of month
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      
      days.push({
        dayNumber: day,
        dateString: dateStr,
        isCurrentMonth: true,
        record: attendanceByDate.get(dateStr)
      });
    }

    return days;
  }, [year, month, attendanceByDate]);

  // Monthly Statistics
  const monthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlyRecords = (student.attendance || []).filter(a => a.date.startsWith(monthPrefix));
    
    const totalSessions = monthlyRecords.length;
    const present = monthlyRecords.filter(a => a.status === 'present').length;
    const absent = monthlyRecords.filter(a => a.status === 'absent').length;
    const late = monthlyRecords.filter(a => a.status === 'late').length;
    const excused = monthlyRecords.filter(a => a.status === 'excused').length;
    
    const attendancePercentage = totalSessions > 0 
      ? Math.round(((present + late * 0.75 + excused * 0.9) / totalSessions) * 100) 
      : 100;

    const completedHw = monthlyRecords.filter(a => a.homeworkStatus === 'completed').length;
    const hwPercentage = totalSessions > 0 ? Math.round((completedHw / totalSessions) * 100) : 100;

    const vocabRecords = monthlyRecords.filter(a => a.vocabScore !== undefined && a.status !== 'absent');
    const vocabAvg = vocabRecords.length > 0 
      ? Math.round(vocabRecords.reduce((acc, curr) => acc + (curr.vocabScore! / (curr.vocabMaxScore || 20)) * 100, 0) / vocabRecords.length)
      : null;

    return {
      totalSessions,
      present,
      absent,
      late,
      excused,
      attendancePercentage,
      hwPercentage,
      vocabAvg
    };
  }, [student.attendance, year, month]);

  // Selected Day Record
  const selectedDayRecord = selectedDateStr ? attendanceByDate.get(selectedDateStr) : undefined;

  // Open Modal to Create or Edit for a specific date
  const handleOpenRecordForm = (targetDateStr: string, existingRecord?: AttendanceRecord) => {
    setSelectedDateStr(targetDateStr);
    setFormDate(targetDateStr);

    if (existingRecord) {
      setModalMode('edit');
      setEditingRecordId(existingRecord.id);
      setFormStatus(existingRecord.status);
      setFormLectureTitle(existingRecord.lectureTitle);
      setFormHwStatus(existingRecord.homeworkStatus);
      setFormVocabScore(existingRecord.vocabScore ?? 20);
      setFormVocabMaxScore(existingRecord.vocabMaxScore ?? 20);
      setFormEntryTime(existingRecord.entryTime || '05:00 م');
      setFormNotes(existingRecord.notes || '');
    } else {
      setModalMode('create');
      setEditingRecordId(null);
      setFormStatus('present');
      setFormLectureTitle(`محاضرة يوم ${targetDateStr}: مراجعة وتدريبات مكثفة`);
      setFormHwStatus('completed');
      setFormVocabScore(20);
      setFormVocabMaxScore(20);
      setFormEntryTime('05:00 م');
      setFormNotes('حضر في الموعد ومعه المذكرة وتم تسليم الواجب كاملاً');
    }

    setShowRecordModal(true);
  };

  // Submit new or updated attendance
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;

    const newRecord: AttendanceRecord = {
      id: editingRecordId || `att-${Date.now()}`,
      date: formDate,
      lectureTitle: formLectureTitle.trim() || `محاضرة لغة إنجليزية (${formDate})`,
      status: formStatus,
      entryTime: formStatus === 'absent' ? undefined : formEntryTime,
      homeworkStatus: formHwStatus,
      vocabScore: formStatus === 'absent' ? undefined : Number(formVocabScore),
      vocabMaxScore: formStatus === 'absent' ? undefined : (Number(formVocabMaxScore) || 20),
      notes: formNotes.trim()
    };

    // Update student's attendance list
    const updatedAttendance = [...(student.attendance || [])];
    const existingIndex = updatedAttendance.findIndex(a => a.date === formDate);

    if (existingIndex >= 0) {
      updatedAttendance[existingIndex] = newRecord;
    } else {
      updatedAttendance.unshift(newRecord);
    }

    // Sort chronologically newest first
    updatedAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    student.attendance = updatedAttendance;
    storageService.updateStudent(student);

    if (onAttendanceUpdated) onAttendanceUpdated();
    
    setShowRecordModal(false);

    if (onSendNotificationToast) {
      const statusLabel = formStatus === 'present' ? 'حاضر ✓' : formStatus === 'absent' ? 'غائب ✗' : 'متأخر ⏳';
      onSendNotificationToast(
        'تم تسجيل الحضور في التقويم 📅',
        `تم حفظ حالة (${statusLabel}) للطالب ${student.fullName} لتاريخ ${formDate}.`
      );
    }
  };

  // Delete attendance record
  const handleDeleteRecord = (recordId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل للحضور؟')) return;

    student.attendance = (student.attendance || []).filter(a => a.id !== recordId);
    storageService.updateStudent(student);

    if (onAttendanceUpdated) onAttendanceUpdated();

    if (onSendNotificationToast) {
      onSendNotificationToast('تم حذف السجل 🗑️', 'تم إزالة الحصة من سجل الحضور بنجاح.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-xl space-y-5 sm:space-y-6">
      {/* Calendar Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 border-b border-slate-800/80 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
              تقويم الحضور والغياب التفاعلي
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400">
            اضغط على أي يوم لرؤية تفاصيل المحاضرة والواجب والتسميع
            {canEdit && '، أو لتسجيل وتعديل الحضور مباشرة'}
          </p>
        </div>

        {/* Month Navigation & Controls (منسقة بدقة لجميع الشاشات الصغيرة والكبيرة) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between sm:justify-end flex-wrap sm:flex-nowrap">
          <div className="flex items-center bg-slate-950/90 rounded-2xl border border-slate-800 p-1 shadow-inner shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="px-2 sm:px-3 text-xs sm:text-sm font-bold text-white min-w-[95px] sm:min-w-[115px] text-center select-none font-latin">
              {MONTH_NAMES_AR[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95"
              title="الشهر القادم"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700/80 transition-all shrink-0 active:scale-95 shadow-sm"
          >
            اليوم
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => handleOpenRecordForm(new Date().toISOString().split('T')[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all shrink-0 w-full sm:w-auto justify-center mt-1 sm:mt-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>تسجيل حصة اليوم</span>
            </button>
          )}
        </div>
      </div>

      {/* Monthly Statistics KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>نسبة حضور الشهر</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white font-latin">
              {monthStats.attendancePercentage}%
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              {monthStats.present} حضور من {monthStats.totalSessions}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>الغياب والتأخير</span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white font-latin">
              {monthStats.absent} غياب
            </span>
            <span className="text-[10px] text-amber-400 font-bold">
              {monthStats.late} متأخر
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>التزام الواجب</span>
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white font-latin">
              {monthStats.hwPercentage}%
            </span>
            <span className="text-[10px] text-blue-300 font-bold">حل متقن</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>متوسط التسميع (Vocab)</span>
            <Award className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white font-latin">
              {monthStats.vocabAvg !== null ? `${monthStats.vocabAvg}%` : '—'}
            </span>
            <span className="text-[10px] text-purple-300 font-bold">تسميع الكلمات</span>
          </div>
        </div>
      </div>

      {/* Interactive Calendar Grid */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-2.5 sm:p-4 overflow-x-auto">
        <div className="min-w-[480px] sm:min-w-0">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {WEEKDAYS_AR.map((dayName, idx) => (
              <div 
                key={idx} 
                className="text-center py-2 text-[11px] sm:text-xs font-bold text-slate-400 bg-slate-900/60 rounded-xl"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((item, index) => {
            if (!item.isCurrentMonth) {
              return (
                <div 
                  key={`empty-${index}`} 
                  className="min-h-[70px] sm:min-h-[85px] rounded-xl bg-slate-900/10 border border-slate-900/20 opacity-30" 
                />
              );
            }

            const record = item.record;
            const isSelected = item.dateString === selectedDateStr;
            const isToday = item.dateString === new Date().toISOString().split('T')[0];

            return (
              <div
                key={item.dateString}
                onClick={() => {
                  setSelectedDateStr(item.dateString);
                }}
                onDoubleClick={() => {
                  if (canEdit) {
                    handleOpenRecordForm(item.dateString, record);
                  }
                }}
                className={`min-h-[75px] sm:min-h-[90px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-950/30'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800/80'
                }`}
              >
                {/* Day Header (Number + Today badge) */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold font-latin rounded-md px-1.5 py-0.5 ${
                    isToday 
                      ? 'bg-blue-600 text-white font-black' 
                      : isSelected 
                      ? 'text-blue-300 bg-blue-900/40' 
                      : 'text-slate-300'
                  }`}>
                    {item.dayNumber}
                  </span>

                  {/* Attendance status dot / icon */}
                  {record && (
                    <span 
                      className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${
                        record.status === 'present'
                          ? 'bg-emerald-400 shadow-emerald-500/50'
                          : record.status === 'absent'
                          ? 'bg-rose-500 shadow-rose-500/50'
                          : record.status === 'late'
                          ? 'bg-amber-400 shadow-amber-500/50'
                          : 'bg-blue-400 shadow-blue-500/50'
                      }`}
                      title={record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'متأخر'}
                    />
                  )}
                </div>

                {/* Day Content Badges */}
                {record ? (
                  <div className="space-y-1 my-1">
                    {/* Status Pill */}
                    <div className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-center truncate ${
                      record.status === 'present'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : record.status === 'absent'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                        : record.status === 'late'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                    }`}>
                      {record.status === 'present' ? 'حاضر ✓' : record.status === 'absent' ? 'غائب ✗' : 'متأخر ⏳'}
                    </div>

                    {/* Vocab Score if present */}
                    {record.vocabScore !== undefined && record.status !== 'absent' && (
                      <div className="flex items-center justify-between text-[9px] font-latin font-bold text-purple-300 px-1 py-0.2 rounded bg-purple-950/50 border border-purple-800/40">
                        <span>تسميع:</span>
                        <span>{record.vocabScore}/{record.vocabMaxScore || 20}</span>
                      </div>
                    )}

                    {/* Homework Indicator Dot */}
                    <div className="flex items-center gap-1 text-[9px] text-slate-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        record.homeworkStatus === 'completed'
                          ? 'bg-emerald-400'
                          : record.homeworkStatus === 'incomplete'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`} />
                      <span className="truncate hidden sm:inline">
                        {record.homeworkStatus === 'completed' ? 'واجب كامل' : 'واجب ناقص'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-6 flex items-center justify-center">
                    {canEdit && (
                      <span className="text-[10px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        + رصد
                      </span>
                    )}
                  </div>
                )}

                {/* Edit Icon for Teacher on hover */}
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRecordForm(item.dateString, record);
                    }}
                    className="absolute top-1 left-1 p-1 rounded bg-slate-800/90 hover:bg-blue-600 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all text-[10px]"
                    title="تسجيل أو تعديل الحضور لهذا اليوم"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-300">دليل الألوان:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <span>حاضر (Present)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>غائب (Absent)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <span>متأخر (Late)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-400" />
            <span>تسميع كلمات (Vocab)</span>
          </div>
        </div>

        {canEdit && (
          <span className="text-blue-400 font-semibold text-[11px]">
            💡 نصيحة: انقر نقراً مزدوجاً على أي يوم لتسجيل أو تعديل الحضور فورياً
          </span>
        )}
      </div>

      {/* Selected Day Details Card */}
      {selectedDateStr && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  تفاصيل يوم: <span className="font-latin text-blue-300">{selectedDateStr}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {selectedDayRecord ? selectedDayRecord.lectureTitle : 'لا توجد حصة مسجلة في هذا التاريخ بعد'}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleOpenRecordForm(selectedDateStr, selectedDayRecord)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{selectedDayRecord ? 'تعديل السجل' : 'تسجيل حضور لهذا اليوم'}</span>
                </button>
                {selectedDayRecord && (
                  <button
                    onClick={() => handleDeleteRecord(selectedDayRecord.id)}
                    className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                    title="حذف هذا السجل"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {selectedDayRecord ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Status */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">حالة الحضور:</span>
                <span className={`inline-flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-full ${
                  selectedDayRecord.status === 'present'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : selectedDayRecord.status === 'absent'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {selectedDayRecord.status === 'present' ? 'حاضر في الموعد ✓' : selectedDayRecord.status === 'absent' ? 'غائب ✗' : 'متأخر ⏳'}
                </span>
                {selectedDayRecord.entryTime && (
                  <span className="text-[10px] text-slate-500 block mt-1 font-latin">
                    وقت الدخول: {selectedDayRecord.entryTime}
                  </span>
                )}
              </div>

              {/* Vocab Recitation */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">تسميع الكلمات (Vocabulary):</span>
                {selectedDayRecord.vocabScore !== undefined && selectedDayRecord.status !== 'absent' ? (
                  <div>
                    <span className="font-black text-sm text-purple-300 font-latin">
                      {selectedDayRecord.vocabScore} / {selectedDayRecord.vocabMaxScore || 20}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {selectedDayRecord.vocabScore >= (selectedDayRecord.vocabMaxScore || 20) * 0.9 ? 'ممتاز جداً ⭐' : 'مقبول'}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 italic">بدون تسميع</span>
                )}
              </div>

              {/* Homework Status */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">الواجب المنزلي:</span>
                <span className={`inline-block font-bold px-2.5 py-1 rounded-lg ${
                  selectedDayRecord.homeworkStatus === 'completed'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : selectedDayRecord.homeworkStatus === 'incomplete'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {selectedDayRecord.homeworkStatus === 'completed'
                    ? 'تم الحل كاملاً ✓'
                    : selectedDayRecord.homeworkStatus === 'incomplete'
                    ? 'حل جزئي ⚠️'
                    : 'لم يحل ✗'}
                </span>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">ملاحظات السكرتارية:</span>
                <p className="text-slate-200 line-clamp-2">
                  {selectedDayRecord.notes || 'لا توجد ملاحظات إضافية على هذا اليوم.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 text-xs">
              لا يوجد نشاط مسجل للطالب في تاريخ {selectedDateStr}.
              {canEdit && (
                <div className="mt-2">
                  <button
                    onClick={() => handleOpenRecordForm(selectedDateStr)}
                    className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold underline"
                  >
                    اضغط هنا لتسجيل حضور أو غياب هذا اليوم
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Record Attendance Modal (For Teachers and Staff) */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  {modalMode === 'create' ? 'تسجيل حضور حصة جديدة' : 'تعديل بيانات الحضور والحصة'}
                </h3>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div>
                <span className="text-xs text-blue-300 font-semibold block mb-1">
                  الطالب: {student.fullName} ({student.code})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">تاريخ الحصة:</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-latin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">حالة الحضور:</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AttendanceStatus)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                  >
                    <option value="present">حاضر (Present) ✓</option>
                    <option value="late">متأخر (Late) ⏳</option>
                    <option value="absent">غائب (Absent) ✗</option>
                    <option value="excused">غياب بعذر مسبق (Excused) ℹ️</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان المحاضرة / الدرس:</label>
                <input
                  type="text"
                  value={formLectureTitle}
                  onChange={(e) => setFormLectureTitle(e.target.value)}
                  placeholder="مثال: Lecture 5: Past Perfect & Translation"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                />
              </div>

              {formStatus !== 'absent' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">الواجب المنزلي:</label>
                      <select
                        value={formHwStatus}
                        onChange={(e) => setFormHwStatus(e.target.value as HomeworkStatus)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                      >
                        <option value="completed">حل كامل ومتقن ✓</option>
                        <option value="incomplete">حل جزئي / واجب ناقص ⚠️</option>
                        <option value="not_submitted">لم يقم بالحل ✗</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">وقت الحضور:</label>
                      <input
                        type="text"
                        value={formEntryTime}
                        onChange={(e) => setFormEntryTime(e.target.value)}
                        placeholder="05:00 م"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-latin"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-purple-300">
                        درجة تسميع الكلمات (Vocabulary Recitation):
                      </label>
                      <span className="text-[10px] text-slate-400">تسميع من {formVocabMaxScore}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">درجة الطالب:</span>
                        <input
                          type="number"
                          min="0"
                          max={formVocabMaxScore}
                          value={formVocabScore}
                          onChange={(e) => setFormVocabScore(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-latin font-bold text-center"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">الدرجة العظمى:</span>
                        <input
                          type="number"
                          min="1"
                          value={formVocabMaxScore}
                          onChange={(e) => setFormVocabMaxScore(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-latin font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظة السكرتارية:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ملاحظات الحضور والالتزام..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وتسجيل الحضور بالتقويم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
