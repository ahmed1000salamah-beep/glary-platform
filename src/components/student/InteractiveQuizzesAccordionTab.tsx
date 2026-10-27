import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Play, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sparkles, 
  Film, 
  HelpCircle,
  AlertCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { OnlineQuizSession, StudentQuizSubmission } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  studentName: string;
  studentCode: string;
  onOpenQuiz: (quiz: OnlineQuizSession) => void;
  onSendToast: (title: string, body: string) => void;
}

export const InteractiveQuizzesAccordionTab: React.FC<Props> = ({
  studentName,
  studentCode,
  onOpenQuiz,
  onSendToast
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<OnlineQuizSession[]>(() => storageService.getQuizzes());
  const [studentResults, setStudentResults] = useState<Record<string, StudentQuizSubmission>>(() => 
    storageService.getStudentQuizSubmissions(studentCode)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setQuizzes(storageService.getQuizzes());
      setStudentResults(storageService.getStudentQuizSubmissions(studentCode));
    };

    window.addEventListener('glary_quizzes_updated', handleUpdate);
    window.addEventListener('glary_storage_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('glary_quizzes_updated', handleUpdate);
      window.removeEventListener('glary_storage_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [studentCode]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  // Icon selector based on type matching user's image:
  // - واجب: ورقة كتابة FileText
  // - سؤال حصة: درع أو ساعة أو صح
  // - المحاضرة: شريط سينمائي Film
  // - ملف المحاضرة: ورقة مستند FileText
  const getItemIcon = (type: OnlineQuizSession['type']) => {
    switch (type) {
      case 'homework':
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'lecture_file':
        return <FileText className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'lecture_video':
        return <Film className="w-4 h-4 text-indigo-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const getTypeBadge = (type: OnlineQuizSession['type']) => {
    switch (type) {
      case 'homework':
        return <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-300 text-[10px] font-bold">واجب إلزامي</span>;
      case 'quiz':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[10px] font-bold">كويز الحصة</span>;
      case 'lecture_file':
        return <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800/60 text-amber-300 text-[10px] font-bold">ملف تدريبي</span>;
      case 'lecture_video':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-[10px] font-bold">محاضرة تفاعلية</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub header notification */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-200 font-bold">
            قائمة الواجبات والكويزات والتدريبات التفاعلية حسب الحصص
          </span>
        </div>
        <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>إذا دخلت وخرجت من الامتحان، تُحسب نتيجتك فورياً وتظهر لك مباشرة.</span>
        </div>
      </div>

      {/* Accordion List Matching Exactly The Provided Screenshot Layout */}
      <div className="space-y-2.5 select-none">
        {quizzes.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-60" />
            <h4 className="font-bold text-white text-sm mb-1">لا توجد كويزات أو امتحانات منشورة حالياً</h4>
            <p className="text-xs text-slate-500">سيظهر هنا أي كويز أو امتحان جديد يرفعه المستر لمجموعتك فوراً.</p>
          </div>
        ) : (
          quizzes.map((item) => {
          const isExpanded = expandedId === item.id;
          const result = studentResults[item.id];
          const hasTaken = Boolean(result);

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900 border-slate-700 shadow-xl'
                  : 'bg-slate-950/90 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Row Header Bar (identical to screenshot: Icon on the right, title, arrow on the left) */}
              <button
                type="button"
                onClick={() => toggleExpand(item.id)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-right cursor-pointer"
              >
                {/* Left side: Arrow indicator + Grade badge if solved */}
                <div className="flex items-center gap-2.5">
                  <div className={`p-1 rounded-lg transition-transform duration-200 ${
                    isExpanded ? 'text-white rotate-180' : 'text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>

                  {hasTaken && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono font-bold text-xs font-latin">
                      {result.score}/{result.maxScore}
                    </span>
                  )}
                </div>

                {/* Right side: Title and icon */}
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-100">
                    {item.title}
                  </span>
                  {getItemIcon(item.type)}
                </div>
              </button>

              {/* Expanded Dropdown Panel */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(item.type)}
                      <span className="flex items-center gap-1 font-latin">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        المدة: {item.durationMinutes} دقيقة
                      </span>
                      <span>•</span>
                      <span className="font-latin font-bold text-slate-300">
                        {item.totalScore} درجة
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      عدد الأسئلة: {item.questions.length} أسئلة اختيار من متعدد
                    </span>
                  </div>

                  {/* Previous Result Box if student already attempted */}
                  {hasTaken ? (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold text-white">
                            تم تسليم هذا التدريب ورصد درجتك:
                          </span>
                          <span className="font-mono font-bold text-emerald-400 font-latin text-sm">
                            {result.score} من {result.maxScore}
                          </span>
                        </div>
                        {result.autoSubmittedOnExit && (
                          <p className="text-[11px] text-amber-300/80 mt-1">
                            ⚠️ تم إنهاء هذا الامتحان واحتساب درجته تلقائياً عند الخروج من الصفحة منعاً للغش.
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => onOpenQuiz(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors whitespace-nowrap self-end sm:self-auto"
                      >
                        عرض تفاصيل وإجابات الامتحان
                      </button>
                    </div>
                  ) : (
                    /* Exam Launch Card */
                    <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-300">
                        <p className="font-bold text-white mb-1">
                          {item.quizLink ? 'امتحان إلكتروني عبر الرابط المعتمد:' : 'تعليمات أداء الامتحان والأمان:'}
                        </p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {item.quizLink 
                            ? 'بمجرد الضغط على بدء الامتحان سيتم فتح رابط الامتحان المعتمد من مستر أحمد تلقائياً في تبويب جديد.'
                            : 'عند الضغط على بدء التدريب سيتم فتح نافذة الامتحان. بمجرد الخروج من النافذة أو فتح تبويب آخر، يتم إنهاء الامتحان فورياً وتصحيح إجاباتك ورصد النتيجة مباشرة لمنع الغش.'
                          }
                        </p>
                        {item.quizLink && (
                          <div className="mt-2 flex items-center gap-1.5 text-blue-400 text-[11px] font-mono font-latin">
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-xs">{item.quizLink}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                        {item.quizLink && (
                          <a
                            href={item.quizLink.trim().startsWith('http') ? item.quizLink.trim() : `https://${item.quizLink.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                            <span>رابط مباشر</span>
                          </a>
                        )}

                        <button
                          onClick={() => {
                            if (item.quizLink && item.quizLink.trim()) {
                              const targetUrl = item.quizLink.trim().startsWith('http')
                                ? item.quizLink.trim()
                                : `https://${item.quizLink.trim()}`;
                              window.open(targetUrl, '_blank', 'noopener,noreferrer');
                              onSendToast('بدء الامتحان 📝', `جاري فتح رابط الامتحان (${item.title}) الآن.`);
                              return;
                            }
                            onOpenQuiz(item);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 whitespace-nowrap hover:scale-[1.02]"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>بدء الامتحان الآن</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
};
