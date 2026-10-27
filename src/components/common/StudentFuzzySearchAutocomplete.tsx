import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, User, Check, Sparkles, X } from 'lucide-react';
import { Student } from '../../types';
import { searchStudentsFuzzy, scoreStudentMatch } from '../../utils/studentSearch';

interface Props {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  selectedStudentId?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onQueryChange?: (query: string) => void;
}

export const StudentFuzzySearchAutocomplete: React.FC<Props> = ({
  students,
  onSelectStudent,
  selectedStudentId,
  placeholder = 'ابحث باسم الطالب، الكود، الهاتف، أو اقرب تطابق...',
  className = '',
  autoFocus = false,
  onQueryChange
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute fuzzy close suggestions
  const suggestions = useMemo(() => {
    if (!query.trim()) {
      return students.slice(0, 6);
    }
    return searchStudentsFuzzy(students, query, 8);
  }, [students, query]);

  const handleSelect = (st: Student) => {
    onSelectStudent(st);
    setQuery(st.fullName);
    setIsOpen(false);
    onQueryChange?.(st.fullName);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    onQueryChange?.('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onQueryChange?.(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pr-10 pl-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-3 top-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="مسح البحث"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto font-cairo">
          <div className="p-2 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{query.trim() ? 'المقترحات الأقرب بالذكاء والفلاتر:' : 'أحدث الطلاب المسجلين:'}</span>
            </span>
            <span className="font-latin text-[10px] text-slate-500 font-bold">
              {suggestions.length} مقترح
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              لا توجد مقترحات قريبة لـ "{query}". تأكد من كتابة الاسم أو الكود.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 p-1">
              {suggestions.map((st) => {
                const matchInfo = query.trim() ? scoreStudentMatch(st, query) : null;
                const isFuzzy = matchInfo?.matchType === 'fuzzy';
                const isSelected = selectedStudentId === st.id;

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelect(st)}
                    className={`w-full p-2.5 rounded-xl text-right transition-all flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-blue-600/30 border border-blue-500/50 text-white'
                        : 'hover:bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 text-blue-400 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-white group-hover:text-blue-300 transition-colors truncate">
                            {st.fullName}
                          </span>
                          {isFuzzy && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/50 shrink-0 font-medium">
                              مقترح قريب
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {st.gradeLevel} • {st.groupName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-latin font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-blue-300">
                        {st.code}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
