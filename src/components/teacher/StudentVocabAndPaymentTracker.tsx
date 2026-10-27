import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Filter, 
  Send, 
  MessageCircle, 
  Sparkles, 
  Calendar, 
  Users, 
  Award, 
  TrendingUp, 
  Receipt, 
  Edit3 
} from 'lucide-react';
import { Student, VocabRecord, PaymentRecord } from '../../types';
import { storageService } from '../../services/storage';
import { EditStudentModal } from './EditStudentModal';
import { TermMonthsManagerModal } from './TermMonthsManagerModal';
import { searchStudentsFuzzy } from '../../utils/studentSearch';
import { StudentFuzzySearchAutocomplete } from '../common/StudentFuzzySearchAutocomplete';

interface Props {
  students: Student[];
  onRefreshStudents: () => void;
  onSendNotificationToast: (title: string, body: string) => void;
  initialStudentCode?: string;
}

export const StudentVocabAndPaymentTracker: React.FC<Props> = ({
  students,
  onRefreshStudents,
  onSendNotificationToast,
  initialStudentCode
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'vocab' | 'payments'>('vocab');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Dynamic Term Months added and managed by the Teacher
  const [academicMonths, setAcademicMonths] = useState<string[]>(() => storageService.getTermMonths());
  const [isTermMonthsModalOpen, setIsTermMonthsModalOpen] = useState(false);

  // Student Edit Modal state
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);

  // Selected student for detail/editing
  const [selectedStudentCode, setSelectedStudentCode] = useState<string>(() => {
    if (initialStudentCode) return initialStudentCode;
    return students[0]?.code || '';
  });

  const selectedStudent = useMemo(() => {
    return students.find(s => s.code.toUpperCase() === selectedStudentCode.toUpperCase()) || students[0] || null;
  }, [students, selectedStudentCode]);

  // Modal for adding new vocab
  const [isAddVocabOpen, setIsAddVocabOpen] = useState(false);
  const [vocabDate, setVocabDate] = useState(new Date().toISOString().split('T')[0]);
  const [vocabUnit, setVocabUnit] = useState('Unit 4: Technology & The Future (Vocab & Idioms)');
  const [vocabScore, setVocabScore] = useState(19);
  const [vocabMaxScore, setVocabMaxScore] = useState(20);
  const [vocabNotes, setVocabNotes] = useState('تسميع تحريري ممتاز وإتقان لمعاني الكلمات');

  // Filter students with fuzzy search support
  const filteredStudents = useMemo(() => {
    const stageFiltered = students.filter(st => {
      return selectedStage === 'all' || st.gradeLevel?.includes(selectedStage);
    });
    if (!searchQuery.trim()) return stageFiltered;
    return searchStudentsFuzzy(stageFiltered, searchQuery, 50);
  }, [students, searchQuery, selectedStage]);

  // Handler for adding vocab record
  const handleSaveVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newRecord: VocabRecord = {
      id: `voc-${Date.now()}`,
      date: vocabDate,
      unit: vocabUnit,
      score: Number(vocabScore),
      maxScore: Number(vocabMaxScore),
      notes: vocabNotes,
      passed: Number(vocabScore) >= Number(vocabMaxScore) * 0.6
    };

    const ok = storageService.addVocabRecord(selectedStudent.code, newRecord);
    if (ok) {
      onRefreshStudents();
      setIsAddVocabOpen(false);
      onSendNotificationToast(
        'تم حفظ سجل التسميع 📚',
        `تم رصد درجة التسميع (${vocabScore}/${vocabMaxScore}) للطالب ${selectedStudent.fullName} بنجاح.`
      );
    }
  };

  // Toggle payment status
  const handleTogglePayment = (month: string, currentStatus?: 'paid' | 'pending') => {
    if (!selectedStudent) return;
    const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    storageService.togglePaymentStatus(selectedStudent.code, month, nextStatus);
    onRefreshStudents();

    onSendNotificationToast(
      'تحديث سجل الدفع 💳',
      `تم تغيير حالة سداد (${month}) للطالب ${selectedStudent.fullName} إلى: ${nextStatus === 'paid' ? 'تم السداد بنجاح ✓' : 'معلق / مستحق ⏳'}`
    );
  };

  // Send WhatsApp receipt
  const handleSendWhatsAppReceipt = (payment: PaymentRecord) => {
    if (!selectedStudent) return;
    const targetPhone = selectedStudent.parentPhone || selectedStudent.phone;
    let clean = targetPhone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '2' + clean;

    const message = `السلام عليكم ورحمة الله وبركاته.\nإيصال سداد مصروفات منصة مستر أحمد المعاطي (خبير اللغة الإنجليزية).\n\nاسم الطالب: ${selectedStudent.fullName}\nكود الطالب: ${selectedStudent.code}\nالمرحلة: ${selectedStudent.gradeLevel}\nالشهر: ${payment.month}\nالمبلغ: ${payment.amount} ج.م\nرقم الإيصال: ${payment.receiptNumber || 'REC-' + Date.now().toString().slice(-6)}\nحالة السداد: تم الدفع بنجاح ✓\nالتاريخ: ${payment.paymentDate || new Date().toISOString().split('T')[0]}\n\nمع تمنياتنا للطالب بدوام التفوق والنجاح!`;

    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Calculate student statistics
  const vocabStats = useMemo(() => {
    if (!selectedStudent) return { total: 0, avg: 0, fullMarks: 0 };
    const history = selectedStudent.vocabHistory || [];
    if (history.length === 0) return { total: 0, avg: 0, fullMarks: 0 };

    const total = history.length;
    const sumScore = history.reduce((acc, h) => acc + h.score, 0);
    const sumMax = history.reduce((acc, h) => acc + h.maxScore, 0);
    const avg = sumMax > 0 ? Math.round((sumScore / sumMax) * 100) : 0;
    const fullMarks = history.filter(h => h.score === h.maxScore).length;

    return { total, avg, fullMarks };
  }, [selectedStudent]);

  const paymentStats = useMemo(() => {
    if (!selectedStudent) return { paidCount: 0, pendingCount: 0, totalPaidAmount: 0 };
    const payments = selectedStudent.payments || [];
    const paid = payments.filter(p => p.status === 'paid');
    const pending = payments.filter(p => p.status === 'pending');
    const totalPaidAmount = paid.reduce((acc, p) => acc + (p.amount || 250), 0);

    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      totalPaidAmount
    };
  }, [selectedStudent]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation Switch */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              {activeSubTab === 'vocab' ? <BookOpen className="w-6 h-6" /> : <CreditCard className="w-6 h-6 text-emerald-400" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{activeSubTab === 'vocab' ? 'سجل تسميع الكلمات والمفردات' : 'سجل الدفع والمصروفات الشهرية'}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  بيانات الطلاب التراكمية
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة دورية لحفظ المفردات وتسميع الحصص، وسجل سداد الاشتراكات الشهرية مع إمكانية إرسال إيصال فوري
              </p>
            </div>
          </div>

          {/* SubTab Switcher */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('vocab')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'vocab'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>سجل التسميع ({selectedStudent?.vocabHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('payments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>سجل الدفع والمصروفات ({paymentStats.paidCount} مسدد)</span>
            </button>
          </div>
        </div>

        {/* Filter & Student Quick Selector Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4">
          <div className="sm:col-span-6 relative">
            <StudentFuzzySearchAutocomplete
              students={filteredStudents}
              selectedStudentId={selectedStudent?.id}
              onSelectStudent={(st) => setSelectedStudentCode(st.code)}
              placeholder="ابحث باسم الطالب، الكود، أو مقترحات قريبة لاختيار ملفه..."
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">جميع المراحل الدراسية</option>
              <option value="الأول الثانوي">الصف الأول الثانوي</option>
              <option value="الثاني الثانوي">الصف الثاني الثانوي</option>
              <option value="الثالث الثانوي">الصف الثالث الثانوي</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStudentCode}
              onChange={(e) => setSelectedStudentCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
            >
              {filteredStudents.map(st => (
                <option key={st.id} value={st.code}>
                  {st.fullName} ({st.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Selected Student Banner Card */}
      {selectedStudent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg">
              {selectedStudent.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800 font-latin">
                  كود: {selectedStudent.code}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                  {selectedStudent.gradeLevel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{selectedStudent.fullName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                هاتف الطالب: {selectedStudent.phone} • ولي الأمر: {selectedStudent.parentPhone || selectedStudent.phone}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          {activeSubTab === 'vocab' ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">إجمالي التسميع</span>
                <span className="text-sm font-bold text-white font-latin">{vocabStats.total} تسميعات</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">متوسط الحفظ</span>
                <span className="text-sm font-bold text-emerald-400 font-latin">{vocabStats.avg}%</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStudentModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="تعديل بيانات الطالب (الاسم، المرحلة، الكود، الأرقام)"
              >
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>تعديل بيانات الطالب ✏️</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddVocabOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ رصد تسميع جديد</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">شهور مسددة</span>
                <span className="text-sm font-bold text-emerald-400 font-latin">{paymentStats.paidCount} شهر</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">إجمالي المسدد</span>
                <span className="text-sm font-bold text-white font-latin">{paymentStats.totalPaidAmount} ج.م</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditStudentModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="تعديل بيانات الطالب (الاسم، المرحلة، الكود، الأرقام)"
              >
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span>تعديل بيانات الطالب ✏️</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTermMonthsModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                title="تخصيص وإضافة أشهر الترم الدراسي بنفسك"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>إدارة أشهر الترم 🗓️</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: SUBTAB 1 - VOCABULARY RECITATION RECORD */}
      {activeSubTab === 'vocab' && selectedStudent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>سجل التسميعات الشامل للطالب ({selectedStudent.fullName})</span>
            </h3>
            <span className="text-xs text-slate-400">الدرجة العظمى المعتادة من 20 درجة</span>
          </div>

          {selectedStudent.vocabHistory && selectedStudent.vocabHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">الوحدة والموضوع</th>
                    <th className="p-3">تاريخ التسميع</th>
                    <th className="p-3">الدرجة</th>
                    <th className="p-3">النسبة</th>
                    <th className="p-3">التقييم</th>
                    <th className="p-3">ملاحظات المستر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {selectedStudent.vocabHistory.map((rec) => {
                    const percent = Math.round((rec.score / rec.maxScore) * 100);
                    const isSuper = percent >= 85;
                    const isPassing = percent >= 60;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-850/50">
                        <td className="p-3 font-bold text-white">{rec.unit}</td>
                        <td className="p-3 font-latin text-slate-400 text-[11px]">{rec.date}</td>
                        <td className="p-3 font-latin font-bold">
                          <span className={isSuper ? 'text-emerald-400' : isPassing ? 'text-amber-400' : 'text-rose-400'}>
                            {rec.score}
                          </span>
                          <span className="text-slate-500 text-[11px]">/{rec.maxScore}</span>
                        </td>
                        <td className="p-3 font-latin">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isSuper ? 'bg-emerald-950 text-emerald-300' : isPassing ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
                          }`}>
                            {percent}%
                          </span>
                        </td>
                        <td className="p-3">
                          {isSuper ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ممتاز ⭐
                            </span>
                          ) : isPassing ? (
                            <span className="text-amber-400 font-bold text-[11px]">جيد جداً 👍</span>
                          ) : (
                            <span className="text-rose-400 font-bold text-[11px]">إعادة تسميع ⚠️</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {rec.notes || 'تم التسميع داخل الحصة'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl space-y-3">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p>لا يوجد سجل تسميع مسجل لهذا الطالب حتى الآن.</p>
              <button
                type="button"
                onClick={() => setIsAddVocabOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                + رصد أول تسميع للطالب
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: SUBTAB 2 - MONTHLY TUITION PAYMENTS */}
      {activeSubTab === 'payments' && selectedStudent && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>سجل الاشتراكات والمصروفات الشهرية ({selectedStudent.fullName})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                قيمة اشتراك الشهر: 250 ج.م • يمكنك تبديل حالة السداد فوراً بضغطة واحدة
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTermMonthsModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="تخصيص وإضافة أشهر الترم الدراسي بنفسك"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>إدارة أشهر الترم (خاص بالمعلم) 🗓️</span>
              </button>

              <div className="text-xs text-slate-300 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                تم سداد: <span className="font-bold text-emerald-400">{paymentStats.paidCount}</span> من <span className="font-bold text-white">{academicMonths.length}</span> شهور
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {academicMonths.map((month) => {
              const payment = selectedStudent.payments?.find(p => p.month === month);
              const isPaid = payment?.status === 'paid';

              return (
                <div
                  key={month}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isPaid
                      ? 'bg-slate-950/80 border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">{month}</h4>
                      <span className="text-[11px] text-slate-400 font-latin font-bold">250 ج.م</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      isPaid ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-amber-950 text-amber-300 border border-amber-700/50'
                    }`}>
                      {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {isPaid ? 'تم السداد' : 'مستحق'}
                    </span>
                  </div>

                  {isPaid && (
                    <div className="text-[10px] text-slate-400 bg-slate-900/80 p-2 rounded-lg space-y-0.5 border border-slate-800">
                      <div>تاريخ الدفع: <span className="font-latin text-slate-200">{payment.paymentDate || '2026-09-01'}</span></div>
                      <div>رقم الإيصال: <span className="font-mono text-emerald-300">{payment.receiptNumber || 'REC-2026-01'}</span></div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleTogglePayment(month, payment?.status)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                        isPaid
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      }`}
                    >
                      {isPaid ? 'تغيير إلى غير مسدد' : 'تسجيل السداد الآن ✓'}
                    </button>

                    {isPaid && payment && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppReceipt(payment)}
                        title="إرسال إيصال السداد على واتساب لولي الأمر"
                        className="p-1.5 rounded-lg bg-emerald-700/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-600/40 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Add New Vocab Recitation Entry */}
      {isAddVocabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>رصد تسميع كلمات جديد</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVocabOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVocab} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الطالب:</label>
                <div className="p-2.5 rounded-xl bg-slate-950 text-white font-bold border border-slate-800">
                  {selectedStudent?.fullName} ({selectedStudent?.code})
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الوحدة / موضوع الكلمات:</label>
                <input
                  type="text"
                  value={vocabUnit}
                  onChange={(e) => setVocabUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">درجة الطالب:</label>
                  <input
                    type="number"
                    min="0"
                    max={vocabMaxScore}
                    value={vocabScore}
                    onChange={(e) => setVocabScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold font-latin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">من إجمالي:</label>
                  <input
                    type="number"
                    min="1"
                    value={vocabMaxScore}
                    onChange={(e) => setVocabMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold font-latin"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تاريخ التسميع:</label>
                <input
                  type="date"
                  value={vocabDate}
                  onChange={(e) => setVocabDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-latin"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات وتقييم:</label>
                <textarea
                  rows={2}
                  value={vocabNotes}
                  onChange={(e) => setVocabNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  placeholder="ملاحظة حول حفظ الكلمات ونطقها..."
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVocabOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  حفظ في السجل فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Student Profile Information */}
      {isEditStudentModalOpen && selectedStudent && (
        <EditStudentModal
          isOpen={isEditStudentModalOpen}
          student={selectedStudent}
          onClose={() => setIsEditStudentModalOpen(false)}
          onSuccess={() => {
            onRefreshStudents();
          }}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}

      {/* Modal: Custom Term Months Management by Teacher */}
      {isTermMonthsModalOpen && (
        <TermMonthsManagerModal
          isOpen={isTermMonthsModalOpen}
          onClose={() => setIsTermMonthsModalOpen(false)}
          onMonthsUpdated={(updatedMonths) => {
            setAcademicMonths(updatedMonths);
            onRefreshStudents();
          }}
          onSendNotificationToast={onSendNotificationToast}
        />
      )}
    </div>
  );
};
