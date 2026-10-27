import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  MapPin, 
  Clock, 
  GraduationCap, 
  CreditCard, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  ArrowLeft,
  Calendar,
  Building2,
  Sparkles
} from 'lucide-react';
import { StudentGroup, Student } from '../../types';
import { storageService } from '../../services/storage';
import { GroupDetailView } from './GroupDetailView';

interface Props {
  onSendNotificationToast?: (title: string, body: string) => void;
}

export const GroupsManager: React.FC<Props> = ({ onSendNotificationToast }) => {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup | null>(null);
  
  // Filters & Search
  const [locationFilter, setLocationFilter] = useState<'all' | 'دمياط' | 'كفر سعد'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit Group Modal
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState<'دمياط' | 'كفر سعد'>('دمياط');
  const [schedule, setSchedule] = useState('');
  const [gradeLevel, setGradeLevel] = useState('الصف الثالث الثانوي');
  const [monthlyPrice, setMonthlyPrice] = useState('350');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dynamicGrades = Array.from(
    new Set([
      'الصف الثالث الثانوي',
      'الصف الثاني الثانوي',
      'الصف الأول الثانوي',
      'الصف الثالث الإعدادي',
      'الصف الثاني الإعدادي',
      'الصف الأول الإعدادي',
      ...groups.map((g) => g.gradeLevel).filter(Boolean)
    ])
  );

  const reloadGroups = () => {
    const list = storageService.getGroups();
    setGroups(list);
  };

  useEffect(() => {
    reloadGroups();
  }, []);

  const handleOpenAddModal = (groupToEdit?: StudentGroup) => {
    if (groupToEdit) {
      setEditingGroup(groupToEdit);
      setName(groupToEdit.name);
      setLocation(groupToEdit.location);
      setSchedule(groupToEdit.schedule);
      setGradeLevel(groupToEdit.gradeLevel);
      setMonthlyPrice(String(groupToEdit.monthlyPrice));
      setNotes(groupToEdit.notes || '');
    } else {
      setEditingGroup(null);
      setName('');
      setLocation('دمياط');
      setSchedule('');
      setGradeLevel('الصف الثالث الثانوي');
      setMonthlyPrice('350');
      setNotes('');
    }
    setFormError('');
    setShowAddGroupModal(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('يرجى إدخال اسم المجموعة.');
      return;
    }

    if (!schedule.trim()) {
      setFormError('يرجى تحديد موعد المجموعة (أيام وساعة الحصة).');
      return;
    }

    const priceNum = parseFloat(monthlyPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('يرجى كتابة سعر اشتراك الشهر بصيغة رقمية صحيحة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const groupData: StudentGroup = {
        id: editingGroup ? editingGroup.id : `grp-${Date.now()}`,
        name: name.trim(),
        location,
        schedule: schedule.trim(),
        gradeLevel: gradeLevel.trim(),
        monthlyPrice: priceNum,
        notes: notes.trim() || undefined,
        createdAt: editingGroup?.createdAt || new Date().toISOString()
      };

      storageService.saveGroup(groupData);
      reloadGroups();
      setShowAddGroupModal(false);

      onSendNotificationToast?.(
        editingGroup ? 'تم تحديث المجموعة ✏️' : 'تمت إضافة المجموعة بنجاح 🎉',
        `تم حفظ بيانات مجموعة (${groupData.name}) بمقر ${groupData.location}.`
      );
    } catch (err: any) {
      setFormError('حدث خطأ أثناء حفظ المجموعة: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: string, groupName: string) => {
    e.stopPropagation();
    if (window.confirm(`هل أنت متأكد من حذف مجموعة (${groupName})؟ لن يتم حذف الطلاب المسجلين بها.`)) {
      storageService.deleteGroup(id);
      reloadGroups();
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
      onSendNotificationToast?.('تم حذف المجموعة 🗑️', `تم حذف مجموعة ${groupName} بنجاح.`);
    }
  };

  // If a group is selected, show detail view
  if (selectedGroup) {
    return (
      <GroupDetailView
        group={selectedGroup}
        onBack={() => {
          setSelectedGroup(null);
          reloadGroups();
        }}
        onSendNotificationToast={onSendNotificationToast}
      />
    );
  }

  // Filter groups
  const filteredGroups = groups.filter(g => {
    const matchLocation = locationFilter === 'all' || g.location === locationFilter;
    const matchGrade = gradeFilter === 'all' || g.gradeLevel === gradeFilter;
    const matchSearch = !searchQuery.trim() || 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.schedule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.location.includes(searchQuery);
    return matchLocation && matchGrade && matchSearch;
  });

  const damiettaCount = groups.filter(g => g.location === 'دمياط').length;
  const kafrSaadCount = groups.filter(g => g.location === 'كفر سعد').length;

  return (
    <div className="space-y-6 font-cairo" dir="rtl">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>إدارة المجموعات والتحضير بالـ NFC</span>
              </span>
              <span className="text-xs text-slate-400 font-latin">
                دمياط & كفر سعد
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              مجموعات السناتر والمقرات الدراسية
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              تصفح مجموعات دمياط وكفر سعد، أضف مجموعات جديدة، وادخل على أي مجموعة لرصد الحضور المباشر بكارت NFC ومتابعة الطلاب وسجلاتهم الكاملة.
            </p>
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>+ إضافة مجموعة جديدة</span>
          </button>
        </div>

        {/* Location Counter Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-2xl font-black text-white">{groups.length}</span>
            <span className="text-slate-400 block mt-0.5">إجمالي المجموعات</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center">
            <span className="text-2xl font-black text-cyan-400">{damiettaCount}</span>
            <span className="text-slate-400 block mt-0.5">مجموعات مقر دمياط</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
            <span className="text-2xl font-black text-emerald-400">{kafrSaadCount}</span>
            <span className="text-slate-400 block mt-0.5">مجموعات مقر كفر سعد</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Location Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setLocationFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
              locationFilter === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            جميع المقرات ({groups.length})
          </button>

          <button
            onClick={() => setLocationFilter('دمياط')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              locationFilter === 'دمياط'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>دمياط ({damiettaCount})</span>
          </button>

          <button
            onClick={() => setLocationFilter('كفر سعد')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              locationFilter === 'كفر سعد'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>كفر سعد ({kafrSaadCount})</span>
          </button>
        </div>

        {/* Grade Filter & Search */}
        <div className="flex flex-1 items-center gap-3">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 shrink-0"
          >
            <option value="all">جميع المراحل الدراسية</option>
            <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
            <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
            <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
            <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
            <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
            <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
          </select>

          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المجموعة أو الموعد..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-10"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-dashed border-slate-800 rounded-3xl">
          <Building2 className="w-14 h-14 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">لا توجد مجموعات مطابقة للبحث</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            يمكنك إضافة مجموعة جديدة بمقر دمياط أو كفر سعد بالضغط على زر "إضافة مجموعة جديدة".
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
          >
            + إضافة مجموعة الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredGroups.map(group => {
            const groupStudents = storageService.getStudentsByGroup(group.name, group.location);
            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-5 shadow-xl transition-all hover:shadow-indigo-500/10 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Location Badge & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                      group.location === 'كفر سعد'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{group.location}</span>
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAddModal(group);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="تعديل المجموعة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeleteGroup(e, group.id, group.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="حذف المجموعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Group Name & Stage */}
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors leading-snug">
                      {group.name}
                    </h3>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {group.gradeLevel}
                    </span>
                  </div>

                  {/* Schedule & Price */}
                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>الموعد: <strong>{group.schedule}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>سعر الشهر: <strong className="text-emerald-400 font-mono">{group.monthlyPrice} ج.م</strong></span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Student Count & Open Button */}
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 font-bold">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>{groupStudents.length} طالب مسجل</span>
                  </span>

                  <span className="text-xs text-indigo-400 group-hover:text-indigo-300 font-black flex items-center gap-1">
                    <span>فتح وتحضير NFC</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT GROUP                                 */}
      {/* ======================================================== */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 font-cairo" dir="rtl">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-5 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingGroup ? 'تعديل بيانات المجموعة' : 'إضافة مجموعة جديدة'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  يرجى ملء جميع الحقول المطلوبة بما فيها المقر (دمياط أو كفر سعد) وموعد وسعر المجموعة.
                </p>
              </div>

              <button
                onClick={() => setShowAddGroupModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveGroup} className="space-y-4">
              
              {/* 1. المكان (دمياط ولا كفر سعد) - Mandatory */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  المقر / المكان: <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocation('دمياط')}
                    className={`py-3 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                      location === 'دمياط'
                        ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 shadow-lg shadow-cyan-950'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>مقر دمياط 📍</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocation('كفر سعد')}
                    className={`py-3 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                      location === 'كفر سعد'
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-lg shadow-emerald-950'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>مقر كفر سعد 📍</span>
                  </button>
                </div>
              </div>

              {/* 2. اسم المجموعة - Mandatory */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  اسم المجموعة: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مجموعة أوائل الثانوية (دمياط)"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 3. موعدها - Mandatory */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  موعد الحصة وأيامها: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="مثال: الأحد والأربعاء - 5:00 م"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 4. صف سنة كام & 5. سعر الشهر */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    صف سنة كام (المرحلة): <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
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
                    سعر الشهر (جنيه مصري): <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    placeholder="350"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ملاحظات أو اسم السنتر/القاعة (اختياري):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: سنتر الأوائل - القاعة الرئيسية..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddGroupModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'جارٍ الحفظ...' : editingGroup ? 'حفظ التعديلات' : 'إضافة المجموعة الآن'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
