import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { OnlineQuizSession, StudentQuizSubmission } from '../../types';
import { storageService } from '../../services/storage';

interface Props {
  quiz: OnlineQuizSession;
  studentName: string;
  studentCode: string;
  onClose: () => void;
  onQuizFinished: (submission: StudentQuizSubmission) => void;
  onSendToast: (title: string, body: string) => void;
}

export const AntiCheatExamModal: React.FC<Props> = ({
  quiz,
  studentName,
  studentCode,
  onClose,
  onQuizFinished,
  onSendToast
}) => {
  const [timeLeft, setTimeLeft] = useState(quiz.durationMinutes * 60);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [exitAutoCalculated, setExitAutoCalculated] = useState(false);
  const [exitReason, setExitReason] = useState<string | null>(null);

  const questions = quiz.questions;
  const pointsPerQuestion = questions.length > 0 ? Math.round(quiz.totalScore / questions.length) : 5;

  // Calculate score helper
  const calculateCurrentScore = (answers: Record<number, number>) => {
    let earned = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && answers[idx] === q.correctOptionIndex) {
        earned += pointsPerQuestion;
      }
    });
    return Math.min(earned, quiz.totalScore);
  };

  // 1. Anti-Cheat & Auto-Grade on Exit:
  // "ولو دخل وخرج تتحسبله النتيجه وتطلعله"
  // If student leaves page / switches tab / window blur, immediately calculate result and show it to him!
  useEffect(() => {
    if (isSubmitted) return;

    const handleTriggerExitAutoSubmit = (reasonText: string) => {
      if (isSubmitted) return;
      const finalScore = calculateCurrentScore(selectedAnswers);
      setScore(finalScore);
      setExitAutoCalculated(true);
      setExitReason(reasonText);
      setIsSubmitted(true);

      const submission: StudentQuizSubmission = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: finalScore,
        maxScore: quiz.totalScore,
        completedAt: new Date().toISOString().split('T')[0],
        autoSubmittedOnExit: true,
        answers: selectedAnswers
      };

      storageService.saveStudentQuizSubmission(studentCode, submission);
      onQuizFinished(submission);
      onSendToast(
        'تم احتساب النتيجة ورصدها تلقائياً 📊',
        `بسبب مغادرة صفحة الامتحان، تم إنهاء الامتحان فورياً واحتساب نتيجتك: ${finalScore} من ${quiz.totalScore}`
      );
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        handleTriggerExitAutoSubmit('تم رصد الخروج من تبويب الامتحان أو فتح نافذة أخرى، فتم إنهاء الامتحان تلقائياً واحتساب إجاباتك حتى لحظة الخروج.');
      }
    };

    const handleWindowBlur = () => {
      if (!isSubmitted) {
        handleTriggerExitAutoSubmit('تم رصد فقدان التركيز ومغادرة متصفح الامتحان، وتم فورياً تصحيح ما تم حله واحتساب الدرجة النهائية.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isSubmitted, selectedAnswers, quiz, studentCode]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, selectedAnswers]);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIdx]: optionIdx
    }));
  };

  const handleSubmit = () => {
    const finalScore = calculateCurrentScore(selectedAnswers);
    setScore(finalScore);
    setIsSubmitted(true);
    setExitAutoCalculated(false);

    const submission: StudentQuizSubmission = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: finalScore,
      maxScore: quiz.totalScore,
      completedAt: new Date().toISOString().split('T')[0],
      autoSubmittedOnExit: false,
      answers: selectedAnswers
    };

    storageService.saveStudentQuizSubmission(studentCode, submission);
    onQuizFinished(submission);
    onSendToast('تم تسليم الامتحان 📝', `تم رصد نتيجتك بنجاح: ${finalScore} من ${quiz.totalScore}`);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="font-extrabold text-white text-sm">
              {quiz.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {!isSubmitted && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-600/60 text-amber-300 font-mono font-latin text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              onClick={() => {
                if (!isSubmitted) {
                  // User intentionally clicking X / close during test: calculate result and submit!
                  handleSubmit();
                } else {
                  onClose();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
              title="إغلاق"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Anti-cheat banner */}
        <div className="bg-blue-950/40 border-b border-blue-900/40 px-5 py-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold">
            الطالب: {studentName} ({studentCode})
          </span>
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>نظام المراقبة: عند الخروج من النافذة تُحسب النتيجة فورياً وتُقفل المحاولة</span>
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isSubmitted ? (
            /* SUBMITTED / AUTO-SUBMITTED RESULT STATE */
            <div className="text-center py-6 space-y-4">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto ${
                exitAutoCalculated 
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' 
                  : 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-400'
              }`}>
                {exitAutoCalculated ? <AlertTriangle className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
              </div>

              <h4 className="text-2xl font-black text-white">
                {exitAutoCalculated ? 'تم الخروج من الامتحان واحتساب النتيجة!' : 'تم تصحيح وتسليم الامتحان بنجاح!'}
              </h4>

              {exitAutoCalculated && exitReason && (
                <p className="text-xs text-amber-300/90 max-w-md mx-auto leading-relaxed bg-amber-950/40 p-3 rounded-xl border border-amber-600/40">
                  ⚠️ {exitReason}
                </p>
              )}

              <div className="inline-block p-5 rounded-2xl bg-slate-950 border border-slate-800 min-w-[220px]">
                <span className="text-xs text-slate-400 block mb-1">الدرجة المحسوبة المستحقة:</span>
                <span className="text-4xl font-black text-emerald-400 font-latin">
                  {score} / {quiz.totalScore}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  النسبة: {Math.round((score / quiz.totalScore) * 100)}%
                </span>
              </div>

              {/* Review of answered questions */}
              <div className="max-w-md mx-auto text-right space-y-2 mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-300">مراجعة الإجابات:</p>
                <div className="space-y-2">
                  {questions.map((q, idx) => {
                    const answered = selectedAnswers[idx];
                    const isCorrect = answered === q.correctOptionIndex;
                    return (
                      <div key={q.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">س {idx + 1}</span>
                          <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCorrect ? 'إجابة صحيحة ✓' : answered !== undefined ? 'إجابة خاطئة ✗' : 'لم يتم الإجابة (0 درجات)'}
                          </span>
                        </div>
                        <p className="text-slate-300 font-latin text-[11px] mb-1">{q.text}</p>
                        <p className="text-slate-400 text-[10px]">
                          الإجابة الصحيحة: <span className="text-emerald-300 font-latin">{q.options[q.correctOptionIndex]}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  إغلاق والعودة لقائمة الواجبات والتدريبات
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE EXAM QUESTIONS */
            <div className="space-y-6">
              {quiz.quizLink && (
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white block mb-0.5">رابط الامتحان الإلكتروني المعتمد من مستر أحمد:</span>
                    <span className="text-slate-400 text-[11px] font-mono font-latin truncate max-w-sm block">{quiz.quizLink}</span>
                  </div>
                  <a
                    href={quiz.quizLink.trim().startsWith('http') ? quiz.quizLink.trim() : `https://${quiz.quizLink.trim()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>فتح رابط الامتحان في نافذة خارجية 🔗</span>
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span className="font-bold text-white">
                  السؤال {currentQuestionIndex + 1} من {questions.length}
                </span>
                <span>درجة السؤال: {pointsPerQuestion} درجات (الإجمالي {quiz.totalScore})</span>
              </div>

              {/* Current Question */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <p className="text-base font-semibold text-white font-latin leading-relaxed">
                  {questions[currentQuestionIndex]?.text}
                </p>
              </div>

              {/* Choices */}
              <div className="space-y-2.5">
                {questions[currentQuestionIndex]?.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === oIdx;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(currentQuestionIndex, oIdx)}
                      className={`w-full p-4 rounded-2xl border text-right transition-all font-latin text-sm flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600/25 border-blue-500 text-white font-bold shadow-md shadow-blue-900/30'
                          : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center font-latin ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-700'
                      }`}>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer navigation */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-300"
                >
                  السؤال السابق
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/20"
                  >
                    السؤال التالي ←
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30"
                  >
                    إنهاء وتسليم الامتحان ✓
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
