import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowRight, 
  CreditCard, 
  Users, 
  Calendar, 
  Search, 
  UserPlus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  Radio, 
  Wifi, 
  Award, 
  Send, 
  Trash2, 
  Sparkles,
  UserCheck,
  ChevronDown,
  Printer,
  Volume2,
  Filter,
  Save,
  Check,
  ArrowUpDown,
  ListFilter
} from 'lucide-react';
import { StudentGroup, Student, GroupDailyAttendance } from '../../types';
import { storageService } from '../../services/storage';
import { StudentFullProfileModal } from './StudentFullProfileModal';
import { AddStudentWithNfcModal } from './AddStudentWithNfcModal';

interface Props {
  group: StudentGroup;
  onBack: () => void;
  onSendNotificationToast?: (title: string, body: string) => void;
}

export const GroupDetailView: React.FC<Props> = ({
  group,
  onBack,
  onSendNotificationToast
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'students'>('attendance');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<GroupDailyAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modals
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Manual search for student who forgot card ("ولو طالب نسي الكرت وبحثت عن اسمه")
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [studentListSearchQuery, setStudentListSearchQuery] = useState('');

  // NFC Scanner State
  const [nfcInput, setNfcInput] = useState('');
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(null);
  const [scanStatusMessage, setScanStatusMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Load students & attendance for this group
  const reloadData = () => {
    const groupStudents = storageService.getStudentsByGroup(group.name, group.location);
    setStudents(groupStudents);
    const dailyAtt = storageService.getGroupAttendance(group.id, selectedDate);
    setAttendanceRecords(dailyAtt);
  };

  useEffect(() => {
    reloadData();
  }, [group, selectedDate]);

  // Keep focus on the NFC scanner input for keyboard/USB RFID readers
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      cardInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(focusTimer);
  }, [activeTab]);

  // Setup Web NFC listener if supported
  useEffect(() => {
    let ndef: any = null;
    const initWebNfc = async () => {
      if (typeof window !== 'undefined' && 'NDEFReader' in window) {
        try {
          ndef = new (window as any).NDEFReader();
          await ndef.scan();
          ndef.onreading = (event: any) => {
            const serial = event.serialNumber || '';
            if (serial) handleProcessCardScan(serial);
          };
        } catch (e) {
          console.warn('Web NFC error:', e);
        }
      }
    };
    initWebNfc();
  }, [students, attendanceRecords, selectedDate]);

  // Play audio chime for check-in
  const playAttendanceChime = (success = true) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 880 : 330, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (success ? 0.18 : 0.3));
    } catch {}
  };

  // Format exact current time in Arabic (e.g. "04:15:32 م")
  const getExactCurrentTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Process NFC Card scan
  const handleProcessCardScan = (cardUid: string) => {
    const cleanUid = cardUid.trim();
    if (!cleanUid) return;

    // Find student with this card code
    const student = storageService.findStudentByNfcCard(cleanUid);

    if (!student) {
      playAttendanceChime(false);
      setScanStatusMessage({
        text: `الكارت المقروء (${cleanUid}) غير مسجل لأي طالب حالياً. يمكنك إضافته من زر "إضافة طالب".`,
        type: 'warning'
      });
      setNfcInput('');
      return;
    }

    // Check if student belongs to this group
    const isSameGroup = (student.groupName || '').includes(group.name) || student.groupName === group.name;

    // Mark attendance
    markStudentAttendance(student, isSameGroup ? undefined : `طالب من ${student.groupName || 'مجموعة أخرى'}`);
    setNfcInput('');
  };

  // Mark student attendance
  const markStudentAttendance = (student: Student, note?: string) => {
    const exactTime = getExactCurrentTime();

    // Check if already checked in today
    const existing = attendanceRecords.find(a => a.studentId === student.id);
    if (existing) {
      playAttendanceChime(true);
      setScanStatusMessage({
        text: `الطالب (${student.fullName}) مسجل حضوره مسبقاً اليوم الساعة ${existing.exactTime}`,
        type: 'warning'
      });
      setLastScannedStudent(student);
      return;
    }

    const newRecord: GroupDailyAttendance = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      groupId: group.id,
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.code,
      nfcCardCode: student.nfcCardCode || student.code,
      date: selectedDate,
      exactTime,
      homeworkStatus: 'completed',
      recitationScore: 10,
      recitationMaxScore: 10,
      notes: note || ''
    };

    storageService.saveGroupAttendance(newRecord);
    setAttendanceRecords(prev => [newRecord, ...prev]);
    setLastScannedStudent(student);
    playAttendanceChime(true);

    setScanStatusMessage({
      text: `تم تسجيل حضور الطالب (${student.fullName}) بنجاح الساعة ${exactTime} ✅`,
      type: 'success'
    });

    onSendNotificationToast?.(
      'تسجيل حضور بالكارت 💳',
      `حضر الطالب ${student.fullName} الساعة ${exactTime}`
    );
  };

  // Update attendance record properties (homework status, recitation score, exact time)
  const handleUpdateRecord = (id: string, updates: Partial<GroupDailyAttendance>) => {
    const record = attendanceRecords.find(r => r.id === id);
    if (!record) return;

    const updated = { ...record, ...updates };
    storageService.saveGroupAttendance(updated);
    setAttendanceRecords(prev => prev.map(r => r.id === id ? updated : r));
  };

  // Delete attendance record
  const handleDeleteRecord = (id: string) => {
    storageService.deleteGroupAttendance(id);
    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
  };

  // Students not yet checked in today
  const absentStudents = students.filter(s => !attendanceRecords.some(a => a.studentId === s.id));

  // Filter absent students for manual search
  const filteredAbsentStudents = absentStudents.filter(s => 
    s.fullName.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(manualSearchQuery))
  );

  // Filter students tab
  const filteredStudentsList = students.filter(s =>
    s.fullName.toLowerCase().includes(studentListSearchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(studentListSearchQuery.toLowerCase()) ||
    (s.nfcCardCode && s.nfcCardCode.toLowerCase().includes(studentListSearchQuery.toLowerCase())) ||
    (s.phone && s.phone.includes(studentListSearchQuery))
  );

  // Sorting & Filtering for Attendance Table
  const [sortOrder, setSortOrder] = useState<'attendance' | 'homework' | 'recitation' | 'name'>('attendance');
  const [filterHwStatus, setFilterHwStatus] = useState<'all' | 'completed' | 'incomplete_or_not'>('all');
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState<string | null>(null);

  // Filtered and Sorted Attendance Records
  const filteredAndSortedAttendanceRecords = useMemo(() => {
    let result = [...attendanceRecords];

    // Filter
    if (filterHwStatus === 'completed') {
      result = result.filter(r => r.homeworkStatus === 'completed');
    } else if (filterHwStatus === 'incomplete_or_not') {
      result = result.filter(r => r.homeworkStatus === 'incomplete' || r.homeworkStatus === 'not_submitted');
    }

    // Sort
    result.sort((a, b) => {
      if (sortOrder === 'recitation') {
        return (b.recitationScore || 0) - (a.recitationScore || 0);
      }
      if (sortOrder === 'homework') {
        const hwRank = (status?: string) => status === 'completed' ? 2 : status === 'incomplete' ? 1 : 0;
        return hwRank(b.homeworkStatus) - hwRank(a.homeworkStatus);
      }
      if (sortOrder === 'name') {
        return a.studentName.localeCompare(b.studentName, 'ar');
      }
      return 0; // default order
    });

    return result;
  }, [attendanceRecords, sortOrder, filterHwStatus]);

  // Save Attendance & Sync Platform Records (حفظ الحضور وتسجيل السجل على المنصة وتنبيه ولي الأمر)
  const handleSaveAndSyncAttendance = () => {
    setIsSavingAttendance(true);
    setSaveSuccessBanner(null);

    try {
      let savedCount = 0;
      let absentCount = 0;

      // 1. Process Present Students
      attendanceRecords.forEach((record) => {
        storageService.saveGroupAttendance(record);
        savedCount++;

        const hwText = record.homeworkStatus === 'completed' 
          ? 'تم حل الواجب كاملاً 🌟' 
          : record.homeworkStatus === 'incomplete' 
          ? 'الواجب ناقص ⚠️' 
          : 'لم يحل الواجب ❌';

        // Add targeted platform notification for parents
        storageService.addNotification({
          title: `حضور الطالب: ${record.studentName} 📋`,
          body: `تم تسجيل حضور الطالب بنجاح اليوم (${record.date}) في مجموعة (${group.name}) الساعة (${record.exactTime}). حالة الواجب: ${hwText} • درجة التسميع: ${record.recitationScore}/${record.recitationMaxScore || 10}.`,
          type: 'attendance',
          targetRole: 'parent',
          targetGroup: group.name,
          icon: 'CheckCircle2'
        });
      });

      // 2. Process Absent Students in this group
      absentStudents.forEach((absentStudent) => {
        const existingAtt = absentStudent.attendance?.find(a => a.date === selectedDate);
        if (!existingAtt) {
          absentStudent.attendance = [
            {
              id: `att-absent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              date: selectedDate,
              lectureTitle: `حصة مجموعة (${group.name})`,
              status: 'absent',
              homeworkStatus: 'not_submitted'
            },
            ...(absentStudent.attendance || [])
          ];
          storageService.updateStudent(absentStudent);
          absentCount++;

          storageService.addNotification({
            title: `تنبيه غياب الطالب: ${absentStudent.fullName} ⚠️`,
            body: `تنبيه: سجل غياب الطالب عن حصة اليوم (${selectedDate}) بمجموعة (${group.name}). يرجى المتابعة مع السكرتارية.`,
            type: 'attendance',
            targetRole: 'parent',
            targetGroup: group.name,
            icon: 'AlertTriangle'
          });
        }
      });

      // Dispatch global events for live updates across app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glary_attendance_saved', { detail: { groupId: group.id, date: selectedDate } }));
        window.dispatchEvent(new Event('glary_storage_changed'));
      }

      const successMsg = `تم حفظ وتأكيد الحضور بنجاح! تم تسجيل (${savedCount}) طالب حاضر، وتوثيق (${absentCount}) غياب، وترحيل كافة البيانات فوراً لصفحات أولياء الأمور والطلاب على المنصة 🎉`;
      setSaveSuccessBanner(successMsg);

      onSendNotificationToast?.(
        'تم حفظ الحضور وتسجيل السجل 💾',
        `تم ترحيل سجل ${savedCount} طالب حاضر لصفحات أولياء الأمور.`
      );

      // Refresh student list
      setStudents(storageService.getStudentsByGroup(group.name, group.location));
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ الحضور: ' + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Send WhatsApp message to parent about attendance, homework, and quiz score
  const handleSendWhatsAppNotification = (record: GroupDailyAttendance) => {
    const student = students.find(s => s.id === record.studentId);
    const targetPhone = student?.parentPhone || student?.phone;

    if (!targetPhone) {
      alert('لا يوجد رقم هاتف مسجل لولي الأمر أو الطالب.');
      return;
    }

    const hwText = record.homeworkStatus === 'completed' 
      ? 'تم حل الواجب كاملاً ومتقناً 🌟' 
      : record.homeworkStatus === 'incomplete' 
      ? 'الواجب ناقص ولم يكتمل ⚠️' 
      : 'لم يحل الواجب المطلوب ❌';

    const msg = `السلام عليكم ورحمة الله،
تحية طيبة من إدارة مستر أحمد المعاطي (خبير اللغة الإنجليزية).
نحيطكم علماً بأن الطالب/ة: *${record.studentName}*
- حضر اليوم بحصة مجموعة: *${group.name}* (${group.location})
- وقت الحضور: *${record.exactTime}*
- موقف الواجب المدرسي: *${hwText}*
- درجة تسميع الكلمات اليوم: *${record.recitationScore} من ${record.recitationMaxScore || 10}*

شكراً لمتابعتكم المستمرة ودعمكم لمستقبل أبنائنا.`;

    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('2') ? cleanPhone : `20${cleanPhone.replace(/^0+/, '')}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="w-11 h-11 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 mt-1 shadow"
              title="العودة لجميع المجموعات"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                  group.location === 'كفر سعد'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                }`}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>مقر {group.location}</span>
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {group.gradeLevel}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                  سعر الشهر: {group.monthlyPrice} ج.م
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">{group.name}</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>المواعيد: <strong>{group.schedule}</strong></span>
                {group.notes && <span className="text-slate-500 mr-2">({group.notes})</span>}
              </p>
            </div>
          </div>

          {/* Quick Actions & Date */}
          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white font-latin focus:outline-none text-xs"
              />
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة طالب للمجموعة بكارت NFC</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-black text-white">{students.length}</span>
            <span className="text-slate-400 block mt-0.5">إجمالي طلاب المجموعة</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{attendanceRecords.length}</span>
            <span className="text-slate-400 block mt-0.5">حضور اليوم ({selectedDate})</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-black text-amber-400">{absentStudents.length}</span>
            <span className="text-slate-400 block mt-0.5">الغياب / غير محضرين</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-center">
            <span className="text-xl sm:text-2xl font-black text-cyan-400">
              {students.length > 0 ? Math.round((attendanceRecords.length / students.length) * 100) : 0}%
            </span>
            <span className="text-slate-400 block mt-0.5">نسبة الحضور اليومي</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>سجل الحضور اليومي الفوري بالـ NFC ({attendanceRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>قائمة طلاب المجموعة وسجلاتهم ({students.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: LIVE ATTENDANCE & NFC SCANNER                     */}
      {/* ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Live NFC Radar & Scanning Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-800/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg">
                    <Wifi className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 absolute -top-1 -right-1 animate-ping" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>قارئ كروت NFC المباشر جاهز</span>
                    <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      نشط ويتلقى الكروت
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    ضع كارت الطالب على القارئ ليتم تسجيل حضوره فوراً وتحديد وقت وصوله بالدقيقة والثانية.
                  </p>
                </div>
              </div>

              {/* NFC Input & Simulation */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <input
                    ref={cardInputRef}
                    type="text"
                    value={nfcInput}
                    onChange={(e) => setNfcInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleProcessCardScan(nfcInput);
                      }
                    }}
                    placeholder="امسح الكارت أو اكتب كوده واضغط Enter..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 pl-10"
                  />
                  <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (absentStudents.length > 0) {
                      const randomStudent = absentStudents[Math.floor(Math.random() * absentStudents.length)];
                      handleProcessCardScan(randomStudent.nfcCardCode || randomStudent.code);
                    } else if (students.length > 0) {
                      handleProcessCardScan(students[0].nfcCardCode || students[0].code);
                    } else {
                      alert('لا يوجد طلاب مسجلون بالمجموعة بعد.');
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs transition-colors shrink-0 border border-indigo-500/30 flex items-center gap-1.5"
                  title="محاكاة مسح كارت طالب للتجربة"
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span>محاكاة مسح كارت 💳</span>
                </button>
              </div>
            </div>

            {/* Scan Status Toast Banner */}
            {scanStatusMessage && (
              <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
                scanStatusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : scanStatusMessage.type === 'warning'
                  ? 'bg-amber-950/60 border border-amber-500/50 text-amber-300'
                  : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
              }`}>
                <div className="flex items-center gap-2">
                  {scanStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {scanStatusMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  {scanStatusMessage.type === 'error' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>{scanStatusMessage.text}</span>
                </div>
                <button
                  onClick={() => setScanStatusMessage(null)}
                  className="text-slate-400 hover:text-white text-xs underline"
                >
                  إخفاء
                </button>
              </div>
            )}
          </div>

          {/* Search for Student Who Forgot Card ("ولو طالب نسي الكرت وبحثت عن اسمه في المجموعه تعرف تسجله حضور") */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <span>تسجيل حضور يدوي في حالة نسيان الطالب لكارت NFC:</span>
              </h4>
              <span className="text-xs text-slate-400">
                الطلاب المتبقين بدون حضور: <strong className="text-amber-400">{absentStudents.length}</strong> طالب
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                placeholder="ابحث باسم الطالب أو كوده لتسجيل حضوره يدوياً الآن..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pl-10"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>

            {/* Quick absent students chips or search results */}
            {manualSearchQuery.trim() && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 max-h-60 overflow-y-auto">
                {filteredAbsentStudents.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">لا يوجد طالب بهذا الاسم لم يسجل حضوره بعد.</p>
                ) : (
                  filteredAbsentStudents.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center">
                          {student.fullName[0]}
                        </div>
                        <div>
                          <strong className="text-white block">{student.fullName}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">كود: {student.code}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          markStudentAttendance(student, 'حضور يدوي (نسي الكارت)');
                          setManualSearchQuery('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>تسجيل حضور الآن</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Today's Attendance List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>قائمة الحضور اليوم ({selectedDate})</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {attendanceRecords.length} طالب حاضر
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  رصد مباشر: وقت الحضور بالدقيقة، موقف الواجب (كامل/ناقص/لم يحل)، ودرجة تسميع الكلمات.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  title="طباعة كشف الحضور"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الكشف</span>
                </button>
              </div>
            </div>

            {/* Sort & Filter Controls Toolbar */}
            {attendanceRecords.length > 0 && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-xs">
                {/* Sort selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ترتيب القائمة حسب:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSortOrder('attendance')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        sortOrder === 'attendance'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      وقت الحضور
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOrder('homework')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        sortOrder === 'homework'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الواجب الكامل 🌟
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOrder('recitation')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        sortOrder === 'recitation'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      درجة التسميع 🏆
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortOrder('name')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        sortOrder === 'name'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      أبجدياً
                    </button>
                  </div>
                </div>

                {/* Filter selector */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تصفية:</span>
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFilterHwStatus('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        filterHwStatus === 'all'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل ({attendanceRecords.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterHwStatus('completed')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        filterHwStatus === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الواجب كامل فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterHwStatus('incomplete_or_not')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        filterHwStatus === 'incomplete_or_not'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      غير كامل / لم يحل
                    </button>
                  </div>
                </div>
              </div>
            )}

            {attendanceRecords.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-300">لم يتم تسجيل حضور أي طالب اليوم بعد</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  قم بتمرير كروت NFC الخاصة بالطلاب على القارئ أو استخدم البحث السريع بالاسم لمن نسي كارته.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedAttendanceRecords.map((record, index) => {
                  const student = students.find(s => s.id === record.studentId);
                  return (
                    <div
                      key={record.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-slate-700"
                    >
                      {/* Student Info & Exact Time */}
                      <div className="flex items-center gap-3.5">
                        <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono">
                          {index + 1}
                        </span>

                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                          {record.studentName ? record.studentName[0] : 'ط'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => student && setSelectedStudentForProfile(student)}
                              className="font-black text-white text-sm hover:text-indigo-400 transition-colors text-right"
                              title="عرض السجل الشامل للطالب"
                            >
                              {record.studentName}
                            </button>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              {record.studentCode}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-indigo-400 font-latin mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>وقت الحضور: <strong>{record.exactTime}</strong></span>
                            {record.notes && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.2 rounded border border-amber-500/20 font-cairo">
                                {record.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Controls: Homework & Recitation */}
                      <div className="flex flex-wrap items-center gap-3">
                        
                        {/* 1. موقف الواجب (كامل / ناقص / لم يحل) */}
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleUpdateRecord(record.id, { homeworkStatus: 'completed' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              record.homeworkStatus === 'completed'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="الواجب كامل ومتقن"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>كامل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateRecord(record.id, { homeworkStatus: 'incomplete' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              record.homeworkStatus === 'incomplete'
                                ? 'bg-amber-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="الواجب ناقص أو جزء منه غير محلول"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>ناقص</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateRecord(record.id, { homeworkStatus: 'not_submitted' })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              record.homeworkStatus === 'not_submitted'
                                ? 'bg-rose-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="لم يحل الواجب نهائياً"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>لم يحل</span>
                          </button>
                        </div>

                        {/* 2. درجة التسميع (0 إلى 10 أو 20) */}
                        <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                          <Award className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-slate-300 font-bold">التسميع:</span>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={record.recitationScore}
                            onChange={(e) => handleUpdateRecord(record.id, { recitationScore: parseFloat(e.target.value) || 0 })}
                            className="w-12 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-bold font-mono text-purple-300 focus:outline-none focus:border-purple-500"
                          />
                          <span className="text-slate-500 font-latin">/ {record.recitationMaxScore || 10}</span>
                        </div>

                        {/* 3. زر إشعار ولي الأمر بالواتساب */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppNotification(record)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 border border-emerald-500/30"
                          title="إرسال تقرير الحضور والواجب لولي الأمر عبر الواتساب"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">إشعار ولي الأمر</span>
                        </button>

                        {/* 4. حذف السجل إذا سجل بالخطأ */}
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="حذف سجل الحضور"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save Attendance & Sync Platform Records Button */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {saveSuccessBanner && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{saveSuccessBanner}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isSavingAttendance || attendanceRecords.length === 0}
                onClick={handleSaveAndSyncAttendance}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-2.5 border border-emerald-400/30 active:scale-[0.99]"
              >
                <Save className="w-5 h-5 text-emerald-300" />
                <span>
                  {isSavingAttendance 
                    ? 'جاري حفظ وترحيل الحضور وتنبيه أولياء الأمور...' 
                    : 'حفظ الحضور وتوثيق السجل على المنصة 💾'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: GROUP STUDENTS & FULL PROFILES                    */}
      {/* ======================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  طلاب المجموعة المسجلين ({students.length} طالب)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  اضغط على أي طالب لفتح سجله وبياناته الكاملة وتفاصيل درجاته ومصروفاته.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ إضافة طالب للمجموعة</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={studentListSearchQuery}
                onChange={(e) => setStudentListSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، كود الطالب، كود كارت NFC، أو رقم الهاتف..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-10"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>

            {/* Students Grid */}
            {filteredStudentsList.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-300">لا يوجد طلاب مطابقين للبحث</h4>
                <p className="text-xs text-slate-500 mt-1">
                  يمكنك إضافة طالب جديد للمجموعة وربط كارت NFC الخاص به من زر الإضافة أعلاه.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredStudentsList.map(student => {
                  const isPresentToday = attendanceRecords.some(a => a.studentId === student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentForProfile(student)}
                      className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg group flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-base flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                          {student.fullName ? student.fullName[0] : 'ط'}
                        </div>

                        <div>
                          <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                            {student.fullName}
                          </h4>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                            <span className="font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              كود: {student.code}
                            </span>
                            <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              <span>{student.nfcCardCode || student.code}</span>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-3">
                            {student.phone && <span>هاتف: {student.phone}</span>}
                            {student.parentPhone && <span>ولي الأمر: {student.parentPhone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPresentToday
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {isPresentToday ? 'حاضر اليوم ✅' : 'لم يحضر'}
                        </span>

                        <span className="text-[10px] text-indigo-400 underline font-semibold group-hover:text-indigo-300">
                          فتح السجل الكامل ←
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Student Full Profile Modal */}
      <StudentFullProfileModal
        student={selectedStudentForProfile}
        isOpen={!!selectedStudentForProfile}
        onClose={() => setSelectedStudentForProfile(null)}
        monthlyFee={group.monthlyPrice}
      />

      {/* Add Student with NFC Modal */}
      <AddStudentWithNfcModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        group={group}
        onStudentAdded={(newStudent) => {
          reloadData();
          onSendNotificationToast?.(
            'تمت إضافة الطالب بنجاح 🎉',
            `تم تسجيل الطالب ${newStudent.fullName} وربط كارت NFC الخاص به بنجاح.`
          );
        }}
      />

    </div>
  );
};
