import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Language } from '@/types';

/* ─── translations ─── */
const T = {
  en: {
    home:'Home', schools:'Schools', students:'Students', fees:'Fees',
    expenses:'Expenses', reports:'Reports', staff:'Staff', settings:'Settings',
    totalSchools:'Total Schools', totalStudents:'Total Students',
    paidStudents:'Paid Students', unpaidStudents:'Unpaid Students',
    totalIncome:'Total Income', totalExpenses:'Total Expenses', netProfit:'Net Profit',
    search:'Search', add:'Add', edit:'Edit', delete:'Delete', save:'Save', cancel:'Cancel',
    name:'Name', phone:'Phone', address:'Address', amount:'Amount', date:'Date',
    note:'Note', type:'Type', role:'Role', salary:'Salary', school:'School',
    month:'Month', student:'Student', status:'Status', active:'Active',
    archived:'Archived', paid:'Paid', unpaid:'Unpaid', grade:'Grade',
    parentName:'Parent Name', parentPhone:'Parent Phone',
    discountType:'Discount Type', discountValue:'Discount Value',
    entryDate:'Entry Date', idNumber:'ID Number', schoolName:'School Name',
    addSchool:'Add School', editSchool:'Edit School', deleteSchool:'Delete School',
    addStudent:'Add Student', editStudent:'Edit Student',
    archive:'Archive', restore:'Restore',
    addFee:'Add Fee', editFee:'Edit Fee', feeType:'Fee Type',
    tuition:'Tuition', transportation:'Transportation', registration:'Registration',
    finalAmount:'Final Amount', billNumber:'Bill Number', discount:'Discount',
    addExpense:'Add Expense', editExpense:'Edit Expense',
    category:'Category', description:'Description', personName:'Person Name',
    salaryExp:'Salary', electricity:'Electricity', rent:'Rent',
    maintenance:'Maintenance', supplies:'Supplies', other:'Other',
    addStaff:'Add Staff', editStaff:'Edit Staff',
    teacher:'Teacher', guard:'Guard', adminStaff:'Admin Staff',
    cleaner:'Cleaner', driver:'Driver', customRole:'Custom Role',
    exitDate:'Exit Date', deactivate:'Deactivate', reactivate:'Reactivate',
    paySalary:'Pay Salary', totalPaid:'Total Paid', paymentHistory:'Payment History',
    none:'None', percentage:'Percentage', free:'Free',
    exportPdf:'Export PDF', exportCsv:'Export CSV', printReport:'Print Report',
    monthlyReport:'Monthly Report', dashboard:'Dashboard',
    filterBySchool:'Filter by School', filterByClass:'Filter by Class',
    allSchools:'All Schools', allClasses:'All Classes', noData:'No data available',
    confirm:'Are you sure?', deleteConfirm:'This action cannot be undone.',
    receipt:'Receipt', paymentDate:'Payment Date', downloadPdf:'Download PDF',
    whatsappReminder:'WhatsApp Reminder', darkMode:'Dark Mode', language:'Language',
    more:'More', staffMember:'Staff Member', archivedStudents:'Archived Students',
    activeStudents:'Active Students', income:'Income', profit:'Profit',
  },
  da: {
    home:'خانه', schools:'مکاتب', students:'شاگردان', fees:'فیس‌ها',
    expenses:'مصارف', reports:'گزارشات', staff:'کارمندان', settings:'تنظیمات',
    totalSchools:'مجموع مکاتب', totalStudents:'مجموع شاگردان',
    paidStudents:'پرداخت شده', unpaidStudents:'پرداخت نشده',
    totalIncome:'مجموع عواید', totalExpenses:'مجموع مصارف', netProfit:'سود خالص',
    search:'جستجو', add:'اضافه', edit:'ویرایش', delete:'حذف', save:'ذخیره', cancel:'لغو',
    name:'نام', phone:'تلفن', address:'آدرس', amount:'مبلغ', date:'تاریخ',
    note:'یادداشت', type:'نوع', role:'وظیفه', salary:'معاش', school:'مکتب',
    month:'ماه', student:'شاگرد', status:'وضعیت', active:'فعال',
    archived:'آرشیف', paid:'پرداخت شده', unpaid:'پرداخت نشده', grade:'صنف',
    parentName:'نام والدین', parentPhone:'تلفن والدین',
    discountType:'نوع تخفیف', discountValue:'مقدار تخفیف',
    entryDate:'تاریخ شمولیت', idNumber:'شماره تذکره', schoolName:'نام مکتب',
    addSchool:'اضافه کردن مکتب', editSchool:'ویرایش مکتب', deleteSchool:'حذف مکتب',
    addStudent:'اضافه کردن شاگرد', editStudent:'ویرایش شاگرد',
    archive:'آرشیف', restore:'بازگردانی',
    addFee:'اضافه کردن فیس', editFee:'ویرایش فیس', feeType:'نوع فیس',
    tuition:'تعلیمی', transportation:'ترانسپورت', registration:'ثبت‌نام',
    finalAmount:'مبلغ نهایی', billNumber:'شماره بل', discount:'تخفیف',
    addExpense:'اضافه کردن مصرف', editExpense:'ویرایش مصرف',
    category:'کتگوری', description:'توضیحات', personName:'نام شخص',
    salaryExp:'معاش', electricity:'برق', rent:'کرایه',
    maintenance:'ترمیمات', supplies:'لوازم', other:'سایر',
    addStaff:'اضافه کردن کارمند', editStaff:'ویرایش کارمند',
    teacher:'استاد', guard:'محافظ', adminStaff:'کارمند اداری',
    cleaner:'نظافتچی', driver:'دریور', customRole:'وظیفه سفارشی',
    exitDate:'تاریخ خروج', deactivate:'غیرفعال', reactivate:'فعال‌سازی',
    paySalary:'پرداخت معاش', totalPaid:'مجموع پرداخت', paymentHistory:'تاریخچه پرداخت',
    none:'هیچ', percentage:'فیصدی', free:'رایگان',
    exportPdf:'دانلود PDF', exportCsv:'دانلود CSV', printReport:'چاپ گزارش',
    monthlyReport:'گزارش ماهانه', dashboard:'داشبورد',
    filterBySchool:'فلتر مکتب', filterByClass:'فلتر صنف',
    allSchools:'همه مکاتب', allClasses:'همه صنف‌ها', noData:'معلومات موجود نیست',
    confirm:'آیا مطمئن هستید؟', deleteConfirm:'این عمل قابل بازگشت نیست.',
    receipt:'رسید', paymentDate:'تاریخ پرداخت', downloadPdf:'دانلود PDF',
    whatsappReminder:'یادآوری واتساپ', darkMode:'حالت تاریک', language:'زبان',
    more:'بیشتر', staffMember:'کارمند', archivedStudents:'شاگردان آرشیف',
    activeStudents:'شاگردان فعال', income:'عواید', profit:'سود',
  },
  ps: {
    home:'کور', schools:'ښوونځي', students:'زدکونکي', fees:'فیسونه',
    expenses:'لګښتونه', reports:'راپورونه', staff:'کارکوونکي', settings:'ترتیبات',
    totalSchools:'ټول ښوونځي', totalStudents:'ټول زدکونکي',
    paidStudents:'ورکړل شوي', unpaidStudents:'نه ورکړل شوي',
    totalIncome:'ټول عواید', totalExpenses:'ټول لګښتونه', netProfit:'خالص ګټه',
    search:'لټون', add:'اضافه', edit:'سمون', delete:'لرې کول', save:'خوندي', cancel:'لغوه',
    name:'نوم', phone:'تلیفون', address:'پته', amount:'مقدار', date:'نېټه',
    note:'یادونه', type:'ډول', role:'دنده', salary:'معاش', school:'ښوونځی',
    month:'میاشت', student:'زدکونکی', status:'حالت', active:'فعال',
    archived:'آرشیف', paid:'ورکړل شوی', unpaid:'نه ورکړل شوی', grade:'ټولګی',
    parentName:'د والدینو نوم', parentPhone:'د والدینو تلیفون',
    discountType:'د تخفیف ډول', discountValue:'د تخفیف مقدار',
    entryDate:'د شمولیت نېټه', idNumber:'د تذکرې شمېره', schoolName:'د ښوونځي نوم',
    addSchool:'ښوونځی اضافه', editSchool:'ښوونځی سمول', deleteSchool:'ښوونځی لرې کول',
    addStudent:'زدکونکی اضافه', editStudent:'زدکونکی سمول',
    archive:'آرشیف', restore:'بیرته راوستل',
    addFee:'فیس اضافه', editFee:'فیس سمول', feeType:'د فیس ډول',
    tuition:'تعلیمي', transportation:'ترانسپورت', registration:'ثبت‌نام',
    finalAmount:'وروستی مقدار', billNumber:'د بل شمېره', discount:'تخفیف',
    addExpense:'لګښت اضافه', editExpense:'لګښت سمول',
    category:'کتګوري', description:'تشریح', personName:'د شخص نوم',
    salaryExp:'معاش', electricity:'برېښنا', rent:'کرایه',
    maintenance:'ترمیم', supplies:'سامان', other:'نور',
    addStaff:'کارکوونکی اضافه', editStaff:'کارکوونکی سمول',
    teacher:'ښوونکی', guard:'ساتونکی', adminStaff:'اداري کارکوونکی',
    cleaner:'صفاکار', driver:'موټروان', customRole:'خپله دنده',
    exitDate:'د وتلو نېټه', deactivate:'غیرفعال', reactivate:'فعالول',
    paySalary:'معاش ورکول', totalPaid:'ټول ورکړل شوي', paymentHistory:'د تادیاتو تاریخچه',
    none:'هیڅ', percentage:'سلنه', free:'وړیا',
    exportPdf:'PDF ډاونلوډ', exportCsv:'CSV ډاونلوډ', printReport:'راپور چاپ',
    monthlyReport:'میاشتنی راپور', dashboard:'ډشبورډ',
    filterBySchool:'د ښوونځي فلټر', filterByClass:'د ټولګي فلټر',
    allSchools:'ټول ښوونځي', allClasses:'ټول ټولګي', noData:'معلومات نشته',
    confirm:'ایا ډاډه یاست؟', deleteConfirm:'دا عمل بېرته نشي کیدای.',
    receipt:'رسید', paymentDate:'د تادیې نېټه', downloadPdf:'PDF ډاونلوډ',
    whatsappReminder:'واټساپ یادونه', darkMode:'تیاره حالت', language:'ژبه',
    more:'نور', staffMember:'کارکوونکی', archivedStudents:'آرشیف شوي زدکونکي',
    activeStudents:'فعال زدکونکي', income:'عواید', profit:'ګټه',
  },
} as const;

type TKey = keyof typeof T.en;

interface Ctx {
  lang: Language;
  setLang: (l: Language) => void;
  t: (k: TKey) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<Ctx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('app-lang') as Language) || 'en');
  const t = (k: TKey) => (T[lang] as any)[k] || (T.en as any)[k] || k;
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const set = (l: Language) => { setLang(l); localStorage.setItem('app-lang', l); };
  return <LanguageContext.Provider value={{ lang, setLang: set, t, dir }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const c = useContext(LanguageContext);
  if (!c) throw new Error('useLanguage outside provider');
  return c;
};
