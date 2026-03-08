import jalaali from 'jalaali-js';
import type { Language } from '@/types';

const shamsiMonths: Record<Language, string[]> = {
  en: ['Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sunbula', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hoot'],
  da: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
  ps: ['وری', 'غویی', 'غبرګولی', 'چنګاښ', 'زمری', 'وږی', 'تله', 'لړم', 'لیندۍ', 'مرغومی', 'سلواغه', 'کب'],
};

const weekDays: Record<Language, string[]> = {
  en: ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'],
  da: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
  ps: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
};

export const toShamsi = (date: Date) => {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return { year: jy, month: jm, day: jd };
};

export const toGregorian = (jy: number, jm: number, jd: number) => {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
};

export const formatShamsi = (date: Date | string, lang: Language = 'en'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const { year, month, day } = toShamsi(d);
  return `${day} ${shamsiMonths[lang][month - 1]} ${year}`;
};

export const formatShamsiShort = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const { year, month, day } = toShamsi(d);
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
};

export const getShamsiMonthDays = (jy: number, jm: number): number => jalaali.jalaaliMonthLength(jy, jm);

export const getShamsiFirstDayOfWeek = (jy: number, jm: number): number => {
  const greg = toGregorian(jy, jm, 1);
  return (greg.getDay() + 1) % 7;
};

export const getCurrentShamsiDate = () => toShamsi(new Date());

export { shamsiMonths, weekDays };
