import jalaali from 'jalaali-js';

const shamsiMonths = {
  en: ['Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sunbula', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hoot'],
  da: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
};

const weekDays = {
  en: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
  da: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
};

export const toShamsi = (date: Date) => {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return { year: jy, month: jm, day: jd };
};

export const toGregorian = (jy: number, jm: number, jd: number) => {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
};

export const formatShamsi = (date: Date | string, lang: 'en' | 'da' = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const { year, month, day } = toShamsi(d);
  const monthName = shamsiMonths[lang][month - 1];
  return `${day} ${monthName} ${year}`;
};

export const formatShamsiShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const { year, month, day } = toShamsi(d);
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
};

export const getShamsiMonthDays = (jy: number, jm: number): number => {
  return jalaali.jalaaliMonthLength(jy, jm);
};

export const getShamsiFirstDayOfWeek = (jy: number, jm: number): number => {
  const greg = toGregorian(jy, jm, 1);
  // Saturday = 0 in our week (Afghan week starts on Saturday)
  return (greg.getDay() + 1) % 7;
};

export const getCurrentShamsiDate = () => toShamsi(new Date());

export { shamsiMonths, weekDays };
