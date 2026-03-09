import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { School, Student, Payment, Expense, Staff, GradeSection, DiscountType, FeeType, ExpenseCategory, StaffRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface Ctx {
  schools: School[]; students: Student[]; payments: Payment[]; expenses: Expense[]; staffList: Staff[];
  loading: boolean;
  addSchool: (s: Omit<School, 'id'>) => Promise<void>;
  updateSchool: (s: School) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  addStudent: (s: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (s: Student) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addPayment: (p: Omit<Payment, 'id'>) => Promise<void>;
  updatePayment: (p: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addStaff: (s: Omit<Staff, 'id'>) => Promise<void>;
  updateStaff: (s: Staff) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
}

const DataContext = createContext<Ctx | null>(null);

// ── Mappers: DB row <-> App type ──

const mapSchoolFromDB = (row: any): School => ({
  id: row.id,
  name: row.name,
  address: row.address,
  phone: row.phone,
  grades: (row.grades || []) as GradeSection[],
});

const mapStudentFromDB = (row: any): Student => ({
  id: row.id,
  name: row.name,
  idNumber: row.id_number,
  grade: row.grade,
  parentName: row.parent_name,
  parentPhone: row.parent_phone,
  discountType: row.discount_type as DiscountType,
  discountValue: Number(row.discount_value),
  monthlyFee: Number(row.monthly_fee),
  entryDate: row.entry_date,
  status: row.status as 'active' | 'archived',
  schoolId: row.school_id,
});

const mapPaymentFromDB = (row: any): Payment => ({
  id: row.id,
  studentId: row.student_id,
  schoolId: row.school_id,
  feeType: row.fee_type as FeeType,
  customFeeLabel: row.custom_fee_label || undefined,
  amount: Number(row.amount),
  discount: Number(row.discount),
  finalAmount: Number(row.final_amount),
  date: row.date,
  note: row.note,
  billNumber: row.bill_number,
});

const mapExpenseFromDB = (row: any): Expense => ({
  id: row.id,
  schoolId: row.school_id,
  category: row.category as ExpenseCategory,
  amount: Number(row.amount),
  description: row.description,
  personName: row.person_name,
  date: row.date,
  billNumber: row.bill_number,
  staffId: row.staff_id || undefined,
});

const mapStaffFromDB = (row: any): Staff => ({
  id: row.id,
  name: row.name,
  role: row.role as StaffRole,
  customRole: row.custom_role || undefined,
  phone: row.phone,
  idNumber: row.id_number,
  salary: Number(row.salary),
  entryDate: row.entry_date,
  exitDate: row.exit_date || undefined,
  active: row.active,
  schoolId: row.school_id,
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch all data on mount ──
  useEffect(() => {
    const fetchAll = async () => {
      const [schRes, stuRes, payRes, expRes, stfRes] = await Promise.all([
        supabase.from('schools').select('*'),
        supabase.from('students').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('staff').select('*'),
      ]);
      if (schRes.data) setSchools(schRes.data.map(mapSchoolFromDB));
      if (stuRes.data) setStudents(stuRes.data.map(mapStudentFromDB));
      if (payRes.data) setPayments(payRes.data.map(mapPaymentFromDB));
      if (expRes.data) setExpenses(expRes.data.map(mapExpenseFromDB));
      if (stfRes.data) setStaffList(stfRes.data.map(mapStaffFromDB));
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ── Schools ──
  const addSchool = useCallback(async (s: Omit<School, 'id'>) => {
    const { data, error } = await supabase.from('schools').insert({
      name: s.name, address: s.address, phone: s.phone, grades: s.grades as any,
    }).select().single();
    if (data && !error) setSchools(prev => [...prev, mapSchoolFromDB(data)]);
  }, []);

  const updateSchool = useCallback(async (s: School) => {
    const { error } = await supabase.from('schools').update({
      name: s.name, address: s.address, phone: s.phone, grades: s.grades as any,
    }).eq('id', s.id);
    if (!error) setSchools(prev => prev.map(x => x.id === s.id ? s : x));
  }, []);

  const deleteSchool = useCallback(async (id: string) => {
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (!error) {
      setSchools(prev => prev.filter(x => x.id !== id));
      setStudents(prev => prev.filter(x => x.schoolId !== id));
      setPayments(prev => prev.filter(x => x.schoolId !== id));
      setExpenses(prev => prev.filter(x => x.schoolId !== id));
      setStaffList(prev => prev.filter(x => x.schoolId !== id));
    }
  }, []);

  // ── Students ──
  const addStudent = useCallback(async (s: Omit<Student, 'id'>) => {
    const { data, error } = await supabase.from('students').insert({
      school_id: s.schoolId, name: s.name, id_number: s.idNumber, grade: s.grade,
      parent_name: s.parentName, parent_phone: s.parentPhone,
      discount_type: s.discountType, discount_value: s.discountValue,
      monthly_fee: s.monthlyFee, entry_date: s.entryDate, status: s.status,
    }).select().single();
    if (data && !error) setStudents(prev => [...prev, mapStudentFromDB(data)]);
  }, []);

  const updateStudent = useCallback(async (s: Student) => {
    const { error } = await supabase.from('students').update({
      school_id: s.schoolId, name: s.name, id_number: s.idNumber, grade: s.grade,
      parent_name: s.parentName, parent_phone: s.parentPhone,
      discount_type: s.discountType, discount_value: s.discountValue,
      monthly_fee: s.monthlyFee, entry_date: s.entryDate, status: s.status,
    }).eq('id', s.id);
    if (!error) setStudents(prev => prev.map(x => x.id === s.id ? s : x));
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) {
      setStudents(prev => prev.filter(x => x.id !== id));
      setPayments(prev => prev.filter(x => x.studentId !== id));
    }
  }, []);

  // ── Payments ──
  const addPayment = useCallback(async (p: Omit<Payment, 'id'>) => {
    const { data, error } = await supabase.from('payments').insert({
      student_id: p.studentId, school_id: p.schoolId, fee_type: p.feeType,
      custom_fee_label: p.customFeeLabel || null, amount: p.amount,
      discount: p.discount, final_amount: p.finalAmount,
      date: p.date, note: p.note, bill_number: p.billNumber,
    }).select().single();
    if (data && !error) setPayments(prev => [...prev, mapPaymentFromDB(data)]);
  }, []);

  const updatePayment = useCallback(async (p: Payment) => {
    const { error } = await supabase.from('payments').update({
      student_id: p.studentId, school_id: p.schoolId, fee_type: p.feeType,
      custom_fee_label: p.customFeeLabel || null, amount: p.amount,
      discount: p.discount, final_amount: p.finalAmount,
      date: p.date, note: p.note, bill_number: p.billNumber,
    }).eq('id', p.id);
    if (!error) setPayments(prev => prev.map(x => x.id === p.id ? p : x));
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (!error) setPayments(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Expenses ──
  const addExpense = useCallback(async (e: Omit<Expense, 'id'>) => {
    const { data, error } = await supabase.from('expenses').insert({
      school_id: e.schoolId, category: e.category, amount: e.amount,
      description: e.description, person_name: e.personName,
      date: e.date, bill_number: e.billNumber, staff_id: e.staffId || null,
    }).select().single();
    if (data && !error) setExpenses(prev => [...prev, mapExpenseFromDB(data)]);
  }, []);

  const updateExpense = useCallback(async (e: Expense) => {
    const { error } = await supabase.from('expenses').update({
      school_id: e.schoolId, category: e.category, amount: e.amount,
      description: e.description, person_name: e.personName,
      date: e.date, bill_number: e.billNumber, staff_id: e.staffId || null,
    }).eq('id', e.id);
    if (!error) setExpenses(prev => prev.map(x => x.id === e.id ? e : x));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(x => x.id !== id));
  }, []);

  // ── Staff ──
  const addStaff = useCallback(async (s: Omit<Staff, 'id'>) => {
    const { data, error } = await supabase.from('staff').insert({
      school_id: s.schoolId, name: s.name, role: s.role,
      custom_role: s.customRole || null, phone: s.phone, id_number: s.idNumber,
      salary: s.salary, entry_date: s.entryDate, exit_date: s.exitDate || null,
      active: s.active,
    }).select().single();
    if (data && !error) setStaffList(prev => [...prev, mapStaffFromDB(data)]);
  }, []);

  const updateStaff = useCallback(async (s: Staff) => {
    const { error } = await supabase.from('staff').update({
      school_id: s.schoolId, name: s.name, role: s.role,
      custom_role: s.customRole || null, phone: s.phone, id_number: s.idNumber,
      salary: s.salary, entry_date: s.entryDate, exit_date: s.exitDate || null,
      active: s.active,
    }).eq('id', s.id);
    if (!error) setStaffList(prev => prev.map(x => x.id === s.id ? s : x));
  }, []);

  const deleteStaff = useCallback(async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (!error) setStaffList(prev => prev.filter(x => x.id !== id));
  }, []);

  return (
    <DataContext.Provider value={{
      schools, students, payments, expenses, staffList, loading,
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
