import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { School, Student, Payment, Expense, Staff } from '@/types';
import { uid } from '@/lib/helpers';

interface Ctx {
  schools: School[]; students: Student[]; payments: Payment[]; expenses: Expense[]; staffList: Staff[];
  addSchool: (s: Omit<School,'id'>) => void;
  updateSchool: (s: School) => void;
  deleteSchool: (id: string) => void;
  addStudent: (s: Omit<Student,'id'>) => void;
  updateStudent: (s: Student) => void;
  deleteStudent: (id: string) => void;
  addPayment: (p: Omit<Payment,'id'>) => void;
  updatePayment: (p: Payment) => void;
  deletePayment: (id: string) => void;
  addExpense: (e: Omit<Expense,'id'>) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  addStaff: (s: Omit<Staff,'id'>) => void;
  updateStaff: (s: Staff) => void;
  deleteStaff: (id: string) => void;
}

const DataContext = createContext<Ctx | null>(null);

const load = <T,>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const save = (key: string, d: unknown) => localStorage.setItem(key, JSON.stringify(d));

const usePersist = <T extends { id: string }>(key: string) => {
  const [items, setItems] = useState<T[]>(() => load<T>(key));
  const set = (fn: (prev: T[]) => T[]) => setItems(prev => { const n = fn(prev); save(key, n); return n; });
  return { items, set };
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const sch = usePersist<School>('schools');
  const stu = usePersist<Student>('students');
  const pay = usePersist<Payment>('payments');
  const exp = usePersist<Expense>('expenses');
  const stf = usePersist<Staff>('staff');

  const addSchool = useCallback((s: Omit<School,'id'>) => sch.set(p => [...p, { ...s, id: uid() }]), []);
  const updateSchool = useCallback((s: School) => sch.set(p => p.map(x => x.id === s.id ? s : x)), []);
  const deleteSchool = useCallback((id: string) => {
    sch.set(p => p.filter(x => x.id !== id));
    stu.set(p => p.filter(x => x.schoolId !== id));
    pay.set(p => p.filter(x => x.schoolId !== id));
    exp.set(p => p.filter(x => x.schoolId !== id));
    stf.set(p => p.filter(x => x.schoolId !== id));
  }, []);

  const addStudent = useCallback((s: Omit<Student,'id'>) => stu.set(p => [...p, { ...s, id: uid() }]), []);
  const updateStudent = useCallback((s: Student) => stu.set(p => p.map(x => x.id === s.id ? s : x)), []);
  const deleteStudent = useCallback((id: string) => {
    stu.set(p => p.filter(x => x.id !== id));
    pay.set(p => p.filter(x => x.studentId !== id));
  }, []);

  const addPayment = useCallback((p: Omit<Payment,'id'>) => pay.set(prev => [...prev, { ...p, id: uid() }]), []);
  const updatePayment = useCallback((p: Payment) => pay.set(prev => prev.map(x => x.id === p.id ? p : x)), []);
  const deletePayment = useCallback((id: string) => pay.set(p => p.filter(x => x.id !== id)), []);

  const addExpense = useCallback((e: Omit<Expense,'id'>) => exp.set(p => [...p, { ...e, id: uid() }]), []);
  const updateExpense = useCallback((e: Expense) => exp.set(p => p.map(x => x.id === e.id ? e : x)), []);
  const deleteExpense = useCallback((id: string) => exp.set(p => p.filter(x => x.id !== id)), []);

  const addStaff = useCallback((s: Omit<Staff,'id'>) => stf.set(p => [...p, { ...s, id: uid() }]), []);
  const updateStaff = useCallback((s: Staff) => stf.set(p => p.map(x => x.id === s.id ? s : x)), []);
  const deleteStaff = useCallback((id: string) => stf.set(p => p.filter(x => x.id !== id)), []);

  return (
    <DataContext.Provider value={{
      schools: sch.items, students: stu.items, payments: pay.items, expenses: exp.items, staffList: stf.items,
      addSchool, updateSchool, deleteSchool,
      addStudent, updateStudent, deleteStudent,
      addPayment, updatePayment, deletePayment,
      addExpense, updateExpense, deleteExpense,
      addStaff, updateStaff, deleteStaff,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const c = useContext(DataContext);
  if (!c) throw new Error('useData outside provider');
  return c;
};
