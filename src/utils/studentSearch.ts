import { Student } from '../types';

/**
 * Normalizes Arabic text by unifying letter variants and stripping diacritics.
 */
export const normalizeArabic = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove Arabic tashkeel / diacritics
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove tatweel
    .replace(/\u0640/g, '')
    // Normalize Alef variants
    .replace(/[إأآاٱ]/g, 'ا')
    // Normalize Taa Marbuta / Haa
    .replace(/ة/g, 'ه')
    // Normalize Yaa / Alef Maqsura
    .replace(/ى/g, 'ي')
    // Normalize repeated whitespace
    .replace(/\s+/g, ' ');
};

/**
 * Calculates Levenshtein distance between two strings
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
};

/**
 * Computes a match score (higher is better, 0 means no match) between student and query
 */
export const scoreStudentMatch = (student: Student, query: string): { score: number; matchType: 'exact' | 'prefix' | 'contains' | 'token' | 'fuzzy' | 'none' } => {
  const qNorm = normalizeArabic(query);
  if (!qNorm) return { score: 0, matchType: 'none' };

  const nameNorm = normalizeArabic(student.fullName);
  const codeNorm = (student.code || '').toLowerCase().trim();
  const phone = (student.phone || '').trim();
  const parentPhone = (student.parentPhone || '').trim();
  const group = normalizeArabic(student.groupName || '');
  const grade = normalizeArabic(student.gradeLevel || '');

  // 1. Exact or prefix match on Code
  if (codeNorm === qNorm) return { score: 100, matchType: 'exact' };
  if (codeNorm.startsWith(qNorm) || codeNorm.includes(qNorm)) return { score: 95, matchType: 'prefix' };

  // 2. Phone match
  if (phone.includes(qNorm) || parentPhone.includes(qNorm)) {
    return { score: 92, matchType: 'contains' };
  }

  // 3. Exact Name Match
  if (nameNorm === qNorm) return { score: 90, matchType: 'exact' };

  // 4. Name starts with query
  if (nameNorm.startsWith(qNorm)) return { score: 85, matchType: 'prefix' };

  // 5. Name contains query
  if (nameNorm.includes(qNorm)) return { score: 75, matchType: 'contains' };

  // 6. Token matching: all query words exist in student name
  const qTokens = qNorm.split(' ').filter(Boolean);
  const nameTokens = nameNorm.split(' ').filter(Boolean);
  const allTokensFound = qTokens.length > 0 && qTokens.every(qToken => 
    nameTokens.some(nToken => nToken.includes(qToken))
  );
  if (allTokensFound) {
    return { score: 70, matchType: 'token' };
  }

  // 7. Group or Grade contains query
  if (group.includes(qNorm) || grade.includes(qNorm)) {
    return { score: 60, matchType: 'contains' };
  }

  // 8. Fuzzy / Close typo matching on name tokens
  // Check if any word in the student name is close to the query (distance <= 1 for short words, <= 2 for longer words)
  let bestFuzzyDistance = Infinity;
  for (const nToken of nameTokens) {
    for (const qToken of qTokens) {
      if (qToken.length < 3) continue; // Don't fuzzy match very short fragments
      const maxAllowedDist = qToken.length <= 4 ? 1 : 2;
      const dist = levenshteinDistance(nToken, qToken);
      if (dist <= maxAllowedDist && dist < bestFuzzyDistance) {
        bestFuzzyDistance = dist;
      }
    }
  }

  if (bestFuzzyDistance <= 2) {
    return { score: 50 - bestFuzzyDistance * 10, matchType: 'fuzzy' };
  }

  // Also check full query fuzzy against name substring
  if (qNorm.length >= 4) {
    for (let i = 0; i <= nameNorm.length - qNorm.length; i++) {
      const sub = nameNorm.substr(i, qNorm.length);
      const dist = levenshteinDistance(sub, qNorm);
      if (dist <= 2) {
        return { score: 45 - dist * 10, matchType: 'fuzzy' };
      }
    }
  }

  return { score: 0, matchType: 'none' };
};

/**
 * Searches and returns students ranked by fuzzy closeness and match relevance.
 */
export const searchStudentsFuzzy = (students: Student[], query: string, limit = 10): Student[] => {
  if (!query || !query.trim()) return students.slice(0, limit);

  const scored = students
    .map(st => ({
      student: st,
      ...scoreStudentMatch(st, query)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(item => item.student);
};
