import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, Award, BookCheck, CheckCircle2, Filter, BarChart3, Activity, Sparkles } from 'lucide-react';
import { Student, ExamRecord, AttendanceRecord } from '../../types';

interface Props {
  student: Student;
  title?: string;
  subtitle?: string;
}

export const StudentProgressCharts: React.FC<Props> = ({ 
  student, 
  title = 'تطور المستوى الأكاديمي والدرجات',
  subtitle = 'تحليل بياني لتطور نتائج الاختبارات والواجبات الدورية'
}) => {
  const [chartView, setChartView] = useState<'all' | 'exams' | 'vocab' | 'homework'>('all');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Prepare Exam Data sorted chronologically (oldest to newest for evolution graph)
  const examChartData = useMemo(() => {
    if (!student.exams || student.exams.length === 0) return [];
    
    const sorted = [...student.exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sorted.map((ex) => {
      const percentage = Math.round((ex.score / ex.maxScore) * 100);
      const shortTitle = ex.title.length > 20 ? ex.title.substring(0, 18) + '...' : ex.title;
      return {
        id: ex.id,
        date: ex.date,
        name: shortTitle,
        fullName: ex.title,
        score: ex.score,
        maxScore: ex.maxScore,
        percentage,
        type: ex.type === 'comprehensive' ? 'شامل' : ex.type === 'monthly' ? 'شهري' : 'كويز',
        rank: ex.gradeRank,
        benchmark: 85 // Benchmark line for excellence
      };
    });
  }, [student.exams]);

  // Prepare Homework & Vocab Recitation Data sorted chronologically (filter out unrecorded 0s from skewing curve)
  const homeworkChartData = useMemo(() => {
    if (!student.attendance || student.attendance.length === 0) return [];

    const sorted = [...student.attendance].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sorted.map((att) => {
      const vocabScore = att.vocabScore ?? 0;
      const vocabMax = att.vocabMaxScore || 20;
      const vocabPercentage = att.vocabScore !== undefined && att.status !== 'absent'
        ? Math.round((vocabScore / vocabMax) * 100)
        : null;
      const hwScorePercent = att.homeworkStatus === 'completed' ? 100 : att.homeworkStatus === 'incomplete' ? 50 : 0;
      const shortTitle = att.lectureTitle.length > 18 ? att.lectureTitle.substring(0, 16) + '...' : att.lectureTitle;

      return {
        id: att.id,
        date: att.date,
        name: shortTitle,
        fullTitle: att.lectureTitle,
        vocabScore,
        vocabMax,
        vocabPercentage,
        hasVocab: vocabPercentage !== null,
        hwPercentage: hwScorePercent,
        hwStatusText: att.homeworkStatus === 'completed' ? 'حل كامل' : att.homeworkStatus === 'incomplete' ? 'حل جزئي' : 'لم يحل',
        status: att.status === 'present' ? 'حاضر' : att.status === 'late' ? 'متأخر' : 'غائب'
      };
    });
  }, [student.attendance]);

  // Only valid vocab records for the pure Vocab curve
  const vocabChartData = useMemo(() => {
    return homeworkChartData.filter(h => h.hasVocab && h.vocabPercentage !== null);
  }, [homeworkChartData]);

  // Combined progression data for the 'all' view with both Exam curve and Recitation curve
  const combinedTimelineData = useMemo(() => {
    const map = new Map<string, {
      date: string;
      label: string;
      examScore?: number;
      examPercentage?: number;
      vocabScore?: number;
      vocabPercentage?: number;
      overallPercentage: number;
      actualScore?: string;
    }>();

    // Insert exams
    examChartData.forEach(ex => {
      const existing = map.get(ex.date);
      if (existing) {
        existing.examPercentage = ex.percentage;
        existing.examScore = ex.score;
        existing.label = `${existing.label} + ${ex.fullName}`;
        existing.overallPercentage = existing.vocabPercentage !== undefined 
          ? Math.round((existing.vocabPercentage + ex.percentage) / 2)
          : ex.percentage;
      } else {
        map.set(ex.date, {
          date: ex.date,
          label: ex.fullName,
          examPercentage: ex.percentage,
          examScore: ex.score,
          overallPercentage: ex.percentage,
          actualScore: `${ex.score}/${ex.maxScore}`
        });
      }
    });

    // Insert vocabs (only if tested)
    vocabChartData.forEach(hw => {
      const existing = map.get(hw.date);
      if (existing) {
        existing.vocabPercentage = hw.vocabPercentage!;
        existing.vocabScore = hw.vocabScore;
        existing.overallPercentage = existing.examPercentage !== undefined
          ? Math.round((existing.examPercentage + hw.vocabPercentage!) / 2)
          : hw.vocabPercentage!;
      } else {
        map.set(hw.date, {
          date: hw.date,
          label: `${hw.fullTitle} (تسميع)`,
          vocabPercentage: hw.vocabPercentage!,
          vocabScore: hw.vocabScore,
          overallPercentage: hw.vocabPercentage!,
          actualScore: `${hw.vocabScore}/${hw.vocabMax}`
        });
      }
    });

    // Sort chronologically
    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [examChartData, vocabChartData]);

  // Summary Metrics
  const examAvg = useMemo(() => {
    if (examChartData.length === 0) return 0;
    const sum = examChartData.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / examChartData.length);
  }, [examChartData]);

  const hwCompletionRate = useMemo(() => {
    if (homeworkChartData.length === 0) return 0;
    const completed = homeworkChartData.filter(h => h.hwPercentage === 100).length;
    return Math.round((completed / homeworkChartData.length) * 100);
  }, [homeworkChartData]);

  const vocabAvg = useMemo(() => {
    if (vocabChartData.length === 0) return 0;
    const sum = vocabChartData.reduce((acc, curr) => acc + (curr.vocabPercentage || 0), 0);
    return Math.round(sum / vocabChartData.length);
  }, [vocabChartData]);

  // Dynamic Trend Indicator calculation: compare recent evaluations vs earlier evaluations
  const performanceTrend = useMemo(() => {
    const scores = combinedTimelineData.map(d => d.overallPercentage);
    if (scores.length < 2) {
      return {
        direction: 'stable',
        label: 'مستقر ومتميز',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/80 border-emerald-700/60',
        description: 'الطالب يحافظ على أداء متزن ومستقر في بداية متابعة التقييمات.'
      };
    }

    const midpoint = Math.floor(scores.length / 2);
    const earlier = scores.slice(0, midpoint);
    const recent = scores.slice(midpoint);

    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const diff = recentAvg - earlierAvg;

    if (diff > 3) {
      return {
        direction: 'up',
        label: 'تصاعدي إيجابي 🚀',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/80 border-emerald-700/60',
        description: 'يسير الطالب في منحنى تصاعدي إيجابي مع تحسن ملحوظ ومستمر في النتائج الأخيرة.'
      };
    } else if (diff < -4) {
      return {
        direction: 'down',
        label: 'يحتاج لمزيد من المتابعة 📉',
        color: 'text-amber-400',
        bg: 'bg-amber-950/80 border-amber-700/60',
        description: 'لوحظ انخفاض في التقييمات الأخيرة مقارنة بالسابق؛ ينصح بتكثيف المراجعة واستدراك التسميع.'
      };
    } else {
      return {
        direction: 'stable',
        label: 'مستقر ومتميز ⭐',
        color: 'text-blue-400',
        bg: 'bg-blue-950/80 border-blue-700/60',
        description: 'مستوى الطالب متوازن وثابت على التفوق مع التزام مستمر في الامتحانات والتسميع.'
      };
    }
  }, [combinedTimelineData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-right text-xs max-w-xs font-sans backdrop-blur-md">
          <p className="font-bold text-white text-sm mb-1">{data.fullName || data.fullTitle || data.label || label}</p>
          <p className="text-[11px] text-slate-400 font-latin mb-2">التاريخ: {data.date}</p>
          
          <div className="space-y-1.5 border-t border-slate-800 pt-2">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300 text-[11px]">{entry.name}:</span>
                </div>
                <span className="font-bold text-white font-latin">
                  {entry.value}% {data.actualScore ? `(${data.actualScore})` : data.score !== undefined ? `(${data.score}/${data.maxScore})` : ''}
                </span>
              </div>
            ))}
            {data.rank && (
              <div className="text-[11px] text-amber-300 font-semibold pt-1 border-t border-slate-800/80">
                🏆 المركز على الدفعة: #{data.rank}
              </div>
            )}
            {data.hwStatusText && (
              <div className="text-[11px] text-blue-300 font-semibold">
                📝 حالة الواجب: {data.hwStatusText}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
          </div>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        {/* View Switchers with smooth scroll for small screens */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View (All vs Exams vs Vocab vs Homework) */}
          <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setChartView('all')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                chartView === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              المنحنى العام
            </button>
            <button
              onClick={() => setChartView('exams')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                chartView === 'exams'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              منحنى الاختبارات ({examChartData.length})
            </button>
            <button
              onClick={() => setChartView('vocab')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                chartView === 'vocab'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              منحنى التسميع 📚 ({vocabChartData.length})
            </button>
            <button
              onClick={() => setChartView('homework')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all ${
                chartView === 'homework'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الواجبات ({homeworkChartData.length})
            </button>
          </div>

          {/* Graph visual type: Area vs Bar */}
          <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'area' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="رسم بياني خطي متصل (Line/Area Chart)"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartType === 'bar' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="رسم بياني بالأعمدة (Bar Chart)"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>متوسط الاختبارات</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white font-latin">{examAvg}%</span>
            <span className={`text-[10px] font-bold ${examAvg >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {examAvg >= 85 ? 'ممتاز ⭐' : 'جيد'}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>متوسط التسميع (Vocab)</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white font-latin">{vocabAvg}%</span>
            <span className="text-[10px] text-purple-300 font-bold">من 20 درجة</span>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <BookCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>إتقان الواجبات</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white font-latin">{hwCompletionRate}%</span>
            <span className="text-[10px] text-emerald-400 font-bold">تسليم منتظم</span>
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>إجمالي التقييمات</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white font-latin">
              {examChartData.length + vocabChartData.length}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">تقييم معتمد</span>
          </div>
        </div>
      </div>

      {/* Recharts Canvas Section */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {chartView === 'all' && (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={combinedTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorVocabGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} 
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Area 
                  type="monotone" 
                  dataKey="overallPercentage" 
                  name="معدل المستوى العام (%)" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorOverall)" 
                  activeDot={{ r: 6, fill: '#60a5fa', stroke: '#1e3a8a', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="vocabPercentage" 
                  name="منحنى درجات التسميع (Vocab) 📝" 
                  stroke="#a855f7" 
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#a855f7', strokeWidth: 1.5, stroke: '#581c87' }}
                  connectNulls
                />
              </AreaChart>
            ) : (
              <BarChart data={combinedTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="overallPercentage" name="معدل المستوى (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="vocabPercentage" name="درجة التسميع (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}

        {chartView === 'exams' && (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={examChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExams" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  name="نسبة درجة الاختبار (%)" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorExams)" 
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="benchmark" 
                  name="مستوى الامتياز المستهدف (85%)" 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            ) : (
              <BarChart data={examChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="percentage" name="نسبة درجة الاختبار (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}

        {/* Dedicated Vocab / Recitation Chart */}
        {chartView === 'vocab' && (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={vocabChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPureVocab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Area 
                  type="monotone" 
                  dataKey="vocabPercentage" 
                  name="منحنى درجات التسميع بالحصة (%)" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPureVocab)" 
                  activeDot={{ r: 6, fill: '#c084fc', stroke: '#581c87', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={vocabChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="vocabPercentage" name="درجة التسميع (%)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}

        {chartView === 'homework' && (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <LineChart data={homeworkChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="vocabPercentage" 
                  name="درجة تسميع الكلمات (%)" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8b5cf6' }}
                  connectNulls
                />
                <Line 
                  type="stepAfter" 
                  dataKey="hwPercentage" 
                  name="إنجاز الواجب المنزلي (%)" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#06b6d4' }}
                />
              </LineChart>
            ) : (
              <BarChart data={homeworkChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="vocabPercentage" name="درجة تسميع الكلمات (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hwPercentage" name="إنجاز الواجب (%)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Insight Box - Dynamic & Accurate */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            performanceTrend.direction === 'up' 
              ? 'bg-emerald-400 animate-pulse' 
              : performanceTrend.direction === 'down'
              ? 'bg-amber-400'
              : 'bg-blue-400'
          }`} />
          <span className="text-slate-300 font-medium">
            مؤشر المستوى: <strong className={performanceTrend.color}>{performanceTrend.label}</strong> — {performanceTrend.description}
          </span>
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-slate-500 font-latin text-[11px]">
            آخر رصد: {new Date().toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>
    </div>
  );
};
