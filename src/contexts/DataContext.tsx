import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { School, Student, Payment, Expense, Staff } from '@/types';

interface DataContextType {
  schools: School[];
  students: Student[];
  payments: Payment[];
  expenses: Expense[];
  staffList: Staff[];
  addSchool: (s: Omit<School, 'id'>) => void;
  updateSchool: (s: School) => void;
  deleteSchool: (id: string) => void;
  addStudent: (s: Omit<Student, 'id'>) => void;
  updateStudent: (s: Student) => void;
  addPayment: (p: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  generateMonthlyFees: (month: string, year: number) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addStaff: (s: Omit<Staff, 'id'>) => void;
  updateStaff: (s: Staff) => void;
  deleteStaff: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

const uid = () => crypto.randomUUID();

const load = <T,>(key: string, def: T[]): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return def; }
};
const save = (key: string, data: unknown) => localStorage.setItem(key, JSON.stringify(data));

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [schools, setSchools] = useState<School[]>(() => load('schools', []));
  const [students, setStudents] = useState<Student[]>(() => load('students', []));
  const [payments, setPayments] = useState<Payment[]>(() => load('payments', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => load('expenses', []));
  const [staffList, setStaffList] = useState<Staff[]>(() => load('staff', []));

  const persist = <T,>(key: string, setter: React.Dispatch<React.SetStateAction<T[]>>) =>
    (updater: (prev: T[]) => T[]) => {
      setter(prev => { const next = updater(prev); save(key, next); return next; });
    };

  const ps = persist<School>('schools', setSchools);
  const pst = persist<Student>('students', setStudents);
  const pp = persist<Payment>('payments', setPayments);
  const pe = persist<Expense>('expenses', setExpenses);
  const psf = persist<Staff>('staff', setStaffList);

  const addSchool = useCallback((s: Omit<School, 'id'>) => ps(prev => [...prev, { ...s, id: uid() }]), []);
  const updateSchool = useCallback((s: School) => ps(prev => prev.map(x => x.id === s.id ? s : x)), []);
  const deleteSchool = useCallback((id: string) => ps(prev => prev.filter(x => x.id !== id)), []);

  const addStudent = useCallback((s: Omit<Student, 'id'>) => pst(prev => [...prev, { ...s, id: uid() }]), []);
  const updateStudent = useCallback((s: Student) => pst(prev => prev.map(x => x.id === s.id ? s : x)), []);

  const addPayment = useCallback((p: Omit<Payment, 'id'>) => pp(prev => [...prev, { ...p, id: uid() }]), []);
  const updatePayment = useCallback((id: string, updates: Partial<Payment>) =>
    pp(prev => prev.map(x => x.id === id ? { ...x, ...updates } : x)), []);

  const generateMonthlyFees = useCallback((month: string, year: number) => {
    pp(prev => {
      const activeStudents = students.filter(s => s.status === 'active');
      const newPayments: Payment[] = [];
      activeStudents.forEach(s => {
        const exists = prev.find(p => p.studentId === s.id && p.month === month && p.year === year);
        if (!exists) {
          newPayments.push({ id: uid(), studentId: s.id, schoolId: s.schoolId, month, year, amount: s.monthlyFee, status: 'unpaid' });
        }
      });
      return [...prev, ...newPayments];
    });
  }, [students]);

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => pe(prev => [...prev, { ...e, id: uid() }]), []);
  const deleteExpense = useCallback((id: string) => pe(prev => prev.filter(x => x.id !== id)), []);

  const addStaff = useCallback((s: Omit<Staff, 'id'>) => psf(prev => [...prev, { ...s, id: uid() }]), []);
  const updateStaff = useCallback((s: Staff) => psf(prev => prev.map(x => x.id === s.id ? s : x)), []);
  const deleteStaff = useCallback((id: string) => psf(prev => prev.filter(x => x.id !== id)), []);

  return (
    <DataContext.Provider value={{
      schools, students, payments, expenses, staffList,
      addSchool, updateSchool, deleteSchool,
      addStudent, updateStudent,
      addPayment, updatePayment, generateMonthlyFees,
      addExpense, deleteExpense,
      addStaff, updateStaff, deleteStaff,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
