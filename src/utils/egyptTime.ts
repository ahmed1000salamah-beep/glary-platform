/**
 * Egyptian Real-Time & Calendar Utility
 * Provides accurate time and date calculations adhering to Africa/Cairo timezone.
 */

export const EGYPT_TIMEZONE = 'Africa/Cairo';

/**
 * Returns current Date adjusted/calculated in Egyptian context
 */
export const getEgyptNow = (): Date => {
  return new Date();
};

/**
 * Formats a date into localized Arabic date (e.g. 24 سبتمبر 2026)
 */
export const formatEgyptDate = (dateInput?: string | number | Date): string => {
  const d = dateInput ? new Date(dateInput) : getEgyptNow();
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: EGYPT_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};

/**
 * Formats time in localized Arabic (e.g. 05:30 م)
 */
export const formatEgyptTime = (dateInput?: string | number | Date): string => {
  const d = dateInput ? new Date(dateInput) : getEgyptNow();
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: EGYPT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

/**
 * Formats full Date & Time (e.g. الخميس، 24 سبتمبر 2026 - 05:30 م)
 */
export const formatEgyptDateTime = (dateInput?: string | number | Date): string => {
  const d = dateInput ? new Date(dateInput) : getEgyptNow();
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: EGYPT_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
};

/**
 * Formats a short standard date YYYY-MM-DD in Cairo timezone
 */
export const formatEgyptDateIso = (dateInput?: string | number | Date): string => {
  const d = dateInput ? new Date(dateInput) : getEgyptNow();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EGYPT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

/**
 * Calculates current academic month in Egyptian academic year
 */
export const getCurrentAcademicMonthName = (): string => {
  const d = getEgyptNow();
  const monthIndex = d.getMonth(); // 0 = Jan, 8 = Sep, 9 = Oct
  const monthNames = [
    'شهر يناير (نصف العام)', // 0
    'شهر فبراير', // 1
    'شهر مارس', // 2
    'شهر أبريل', // 3
    'شهر مايو (المراجعات)', // 4
    'شهر يونيو (المراجعة النهائية)', // 5
    'شهر يوليو (العطلة الصيفية)', // 6
    'شهر أغسطس (بدء التأسيس)', // 7
    'شهر سبتمبر (بداية العام الدراسي)', // 8
    'شهر أكتوبر', // 9
    'شهر نوفمبر', // 10
    'شهر ديسمبر' // 11
  ];
  return monthNames[monthIndex] || 'شهر دراسي حالي';
};
