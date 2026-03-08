import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '@/types';

const translations = {
  en: {
    home: 'Home', schools: 'Schools', students: 'Students', fees: 'Fees',
    expenses: 'Expenses', reports: 'Reports', staff: 'Staff', settings: 'Settings',
    totalSchools: 'Total Schools', totalStudents: 'Total Students',
    paidStudents: 'Paid Students', unpaidStudents: 'Unpaid Students',
    totalIncome: 'Total Income', totalExpenses: 'Total Expenses', netProfit: 'Net Profit',
    selectMonth: 'Select Month', search: 'Search', add: 'Add', edit: 'Edit',
    delete: 'Delete', save: 'Save', cancel: 'Cancel', name: 'Name',
    fatherName: 'Father Name', grade: 'Class / Grade', phone: 'Phone',
    monthlyFee: 'Monthly Fee', enrollmentDate: 'Enrollment Date', status: 'Status',
    active: 'Active', archived: 'Archived', paid: 'Paid', unpaid: 'Unpaid',
    schoolName: 'School Name', city: 'City / Province', address: 'Address',
    amount: 'Amount', date: 'Date', note: 'Note', type: 'Type', role: 'Role',
    salary: 'Salary', school: 'School', month: 'Month', student: 'Student',
    markAsPaid: 'Mark as Paid', generateFees: 'Generate Monthly Fees',
    exportPdf: 'Export PDF', printReport: 'Print Report', exportExcel: 'Export Excel',
    whatsappReminder: 'WhatsApp Reminder', darkMode: 'Dark Mode', language: 'Language',
    receipt: 'Receipt', paymentDate: 'Payment Date', downloadPdf: 'Download PDF',
    addSchool: 'Add School', editSchool: 'Edit School', addStudent: 'Add Student',
    editStudent: 'Edit Student', addExpense: 'Add Expense', addStaff: 'Add Staff',
    editStaff: 'Edit Staff', archive: 'Archive', profile: 'Profile',
    paymentHistory: 'Payment History', monthlyReport: 'Monthly Report',
    filterBySchool: 'Filter by School', filterByClass: 'Filter by Class',
    filterByMonth: 'Filter by Month', allSchools: 'All Schools', allClasses: 'All Classes',
    noData: 'No data available', confirm: 'Are you sure?',
    teacher: 'Teacher', driver: 'Driver', guard: 'Guard', cleaner: 'Cleaner',
    administrator: 'Administrator', teacherSalary: 'Teacher Salary',
    driverSalary: 'Driver Salary', guardSalary: 'Guard Salary',
    cleanerSalary: 'Cleaner Salary', electricity: 'Electricity', internet: 'Internet',
    water: 'Water', other: 'Other', thisMonth: 'This Month',
    january: 'January', february: 'February', march: 'March', april: 'April',
    may: 'May', june: 'June', july: 'July', august: 'August',
    september: 'September', october: 'October', november: 'November', december: 'December',
  },
  da: {
    home: 'خانه', schools: 'مکاتب', students: 'شاگردان', fees: 'فیس',
    expenses: 'مصارف', reports: 'گزارشات', staff: 'کارمندان', settings: 'تنظیمات',
    totalSchools: 'مجموع مکاتب', totalStudents: 'مجموع شاگردان',
    paidStudents: 'شاگردان پرداخت شده', unpaidStudents: 'شاگردان پرداخت نشده',
    totalIncome: 'مجموع عواید', totalExpenses: 'مجموع مصارف', netProfit: 'سود خالص',
    selectMonth: 'انتخاب ماه', search: 'جستجو', add: 'اضافه', edit: 'ویرایش',
    delete: 'حذف', save: 'ذخیره', cancel: 'لغو', name: 'نام',
    fatherName: 'نام پدر', grade: 'صنف', phone: 'تلفن',
    monthlyFee: 'فیس ماهانه', enrollmentDate: 'تاریخ ثبت نام', status: 'وضعیت',
    active: 'فعال', archived: 'آرشیف', paid: 'پرداخت شده', unpaid: 'پرداخت نشده',
    schoolName: 'نام مکتب', city: 'شهر / ولایت', address: 'آدرس',
    amount: 'مبلغ', date: 'تاریخ', note: 'یادداشت', type: 'نوع', role: 'وظیفه',
    salary: 'معاش', school: 'مکتب', month: 'ماه', student: 'شاگرد',
    markAsPaid: 'پرداخت شد', generateFees: 'تولید فیس ماهانه',
    exportPdf: 'دانلود PDF', printReport: 'چاپ گزارش', exportExcel: 'دانلود Excel',
    whatsappReminder: 'یادآوری واتساپ', darkMode: 'حالت تاریک', language: 'زبان',
    receipt: 'رسید', paymentDate: 'تاریخ پرداخت', downloadPdf: 'دانلود PDF',
    addSchool: 'اضافه کردن مکتب', editSchool: 'ویرایش مکتب', addStudent: 'اضافه کردن شاگرد',
    editStudent: 'ویرایش شاگرد', addExpense: 'اضافه کردن مصرف', addStaff: 'اضافه کردن کارمند',
    editStaff: 'ویرایش کارمند', archive: 'آرشیف', profile: 'پروفایل',
    paymentHistory: 'تاریخچه پرداخت', monthlyReport: 'گزارش ماهانه',
    filterBySchool: 'فلتر بر اساس مکتب', filterByClass: 'فلتر بر اساس صنف',
    filterByMonth: 'فلتر بر اساس ماه', allSchools: 'همه مکاتب', allClasses: 'همه صنف‌ها',
    noData: 'معلومات موجود نیست', confirm: 'آیا مطمئن هستید؟',
    teacher: 'استاد', driver: 'دریور', guard: 'محافظ', cleaner: 'نظافتچی',
    administrator: 'مدیر', teacherSalary: 'معاش استاد',
    driverSalary: 'معاش دریور', guardSalary: 'معاش محافظ',
    cleanerSalary: 'معاش نظافتچی', electricity: 'برق', internet: 'انترنت',
    water: 'آب', other: 'سایر', thisMonth: 'این ماه',
    january: 'جنوری', february: 'فبروری', march: 'مارچ', april: 'اپریل',
    may: 'می', june: 'جون', july: 'جولای', august: 'آگست',
    september: 'سپتمبر', october: 'اکتوبر', november: 'نومبر', december: 'دسمبر',
  },
};

type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => 
    (localStorage.getItem('app-lang') as Language) || 'en'
  );

  const t = (key: TranslationKey) => translations[lang][key] || key;
  const dir = lang === 'da' ? 'rtl' : 'ltr';

  const handleSetLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('app-lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
