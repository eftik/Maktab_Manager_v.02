import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { School, Student, Payment, Expense, Staff, GradeSection, DiscountType, FeeType, ExpenseCategory, StaffRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { uid } from '@/lib/helpers';
import { idbGetAll, idbPutAll, idbGetQueue, idbSaveQueue, idbAddToQueue } from '@/lib/indexedDB';

// ── Offline queue types ──
interface QueuedMutation {
  id: string;
  table: 'schools' | 'students' | 'payments' | 'expenses' | 'staff';
  action: 'insert' | 'update' | 'delete';
  data: any;
  localId: string;
  timestamp: number;
}

type SyncStatus = 'online' | 'offline' | 'syncing' | 'error';

interface Ctx {
  schools: School[]; students: Student[]; payments: Payment[]; expenses: Expense[]; staffList: Staff[];
  loading: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
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
  id: row.id, name: row.name, address: row.address, phone: row.phone,
  grades: (row.grades || []) as GradeSection[],
});
const mapStudentFromDB = (row: any): Student => ({
  id: row.id, name: row.name, idNumber: row.id_number, grade: row.grade,
  parentName: row.parent_name, parentPhone: row.parent_phone,
  discountType: row.discount_type as DiscountType, discountValue: Number(row.discount_value),
  monthlyFee: Number(row.monthly_fee), entryDate: row.entry_date,
  status: row.status as 'active' | 'archived', schoolId: row.school_id,
});
const mapPaymentFromDB = (row: any): Payment => ({
  id: row.id, studentId: row.student_id, schoolId: row.school_id,
  feeType: row.fee_type as FeeType, customFeeLabel: row.custom_fee_label || undefined,
  amount: Number(row.amount), discount: Number(row.discount), finalAmount: Number(row.final_amount),
  date: row.date, note: row.note, billNumber: row.bill_number,
});
const mapExpenseFromDB = (row: any): Expense => ({
  id: row.id, schoolId: row.school_id, category: row.category as ExpenseCategory,
  amount: Number(row.amount), description: row.description, personName: row.person_name,
  date: row.date, billNumber: row.bill_number, staffId: row.staff_id || undefined,
});
const mapStaffFromDB = (row: any): Staff => ({
  id: row.id, name: row.name, role: row.role as StaffRole, customRole: row.custom_role || undefined,
  phone: row.phone, idNumber: row.id_number, salary: Number(row.salary),
  entryDate: row.entry_date, exitDate: row.exit_date || undefined,
  active: row.active, schoolId: row.school_id,
});

// ── DB row builders ──
const schoolToRow = (s: Omit<School, 'id'> & { id?: string }) => ({
  ...(s.id ? { id: s.id } : {}),
  name: s.name, address: s.address, phone: s.phone, grades: s.grades as any,
});
const studentToRow = (s: Omit<Student, 'id'> & { id?: string }) => ({
  ...(s.id ? { id: s.id } : {}),
  school_id: s.schoolId, name: s.name, id_number: s.idNumber, grade: s.grade,
  parent_name: s.parentName, parent_phone: s.parentPhone,
  discount_type: s.discountType, discount_value: s.discountValue,
  monthly_fee: s.monthlyFee, entry_date: s.entryDate, status: s.status,
});
const paymentToRow = (p: Omit<Payment, 'id'> & { id?: string }) => ({
  ...(p.id ? { id: p.id } : {}),
  student_id: p.studentId, school_id: p.schoolId, fee_type: p.feeType,
  custom_fee_label: p.customFeeLabel || null, amount: p.amount,
  discount: p.discount, final_amount: p.finalAmount,
  date: p.date, note: p.note, bill_number: p.billNumber,
});
const expenseToRow = (e: Omit<Expense, 'id'> & { id?: string }) => ({
  ...(e.id ? { id: e.id } : {}),
  school_id: e.schoolId, category: e.category, amount: e.amount,
  description: e.description, person_name: e.personName,
  date: e.date, bill_number: e.billNumber, staff_id: e.staffId || null,
});
const staffToRow = (s: Omit<Staff, 'id'> & { id?: string }) => ({
  ...(s.id ? { id: s.id } : {}),
  school_id: s.schoolId, name: s.name, role: s.role,
  custom_role: s.customRole || null, phone: s.phone, id_number: s.idNumber,
  salary: s.salary, entry_date: s.entryDate, exit_date: s.exitDate || null,
  active: s.active,
});

const ROW_BUILDERS: Record<string, (d: any) => any> = {
  schools: schoolToRow, students: studentToRow, payments: paymentToRow,
  expenses: expenseToRow, staff: staffToRow,
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'online' : 'offline');
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const syncingRef = useRef(false);
  const idMapRef = useRef<Map<string, string>>(new Map());
  const initializedRef = useRef(false);

  // ── Online/Offline detection ──
  useEffect(() => {
    const goOnline = () => { setIsOnline(true); setSyncStatus('online'); };
    const goOffline = () => { setIsOnline(false); setSyncStatus('offline'); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // ── Persist to IndexedDB whenever state changes ──
  useEffect(() => { if (initializedRef.current) idbPutAll('schools', schools); }, [schools]);
  useEffect(() => { if (initializedRef.current) idbPutAll('students', students); }, [students]);
  useEffect(() => { if (initializedRef.current) idbPutAll('payments', payments); }, [payments]);
  useEffect(() => { if (initializedRef.current) idbPutAll('expenses', expenses); }, [expenses]);
  useEffect(() => { if (initializedRef.current) idbPutAll('staff', staffList); }, [staffList]);
  useEffect(() => { if (initializedRef.current) idbSaveQueue(queue); }, [queue]);

  // ── Load from IndexedDB first, then fetch from server ──
  useEffect(() => {
    const init = async () => {
      // Load cached data from IndexedDB
      const [cachedSchools, cachedStudents, cachedPayments, cachedExpenses, cachedStaff, cachedQueue] = await Promise.all([
        idbGetAll<School>('schools'),
        idbGetAll<Student>('students'),
        idbGetAll<Payment>('payments'),
        idbGetAll<Expense>('expenses'),
        idbGetAll<Staff>('staff'),
        idbGetQueue(),
      ]);

      if (cachedSchools.length) setSchools(cachedSchools);
      if (cachedStudents.length) setStudents(cachedStudents);
      if (cachedPayments.length) setPayments(cachedPayments);
      if (cachedExpenses.length) setExpenses(cachedExpenses);
      if (cachedStaff.length) setStaffList(cachedStaff);
      if (cachedQueue.length) setQueue(cachedQueue);

      initializedRef.current = true;

      // Then fetch fresh data from server if online
      if (navigator.onLine) {
        try {
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
        } catch { /* use cached data */ }
      }
      setLoading(false);
    };
    init();
  }, []);

  // ── Queue a mutation ──
  const enqueue = useCallback(async (m: Omit<QueuedMutation, 'id' | 'timestamp'>) => {
    const mutation: QueuedMutation = { ...m, id: uid(), timestamp: Date.now() };
    setQueue(prev => [...prev, mutation]);
    await idbAddToQueue(mutation);
  }, []);

  // ── Process the offline queue ──
  const processQueue = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    const pending = await idbGetQueue();
    if (pending.length === 0) return;

    syncingRef.current = true;
    setSyncStatus('syncing');
    const remaining: QueuedMutation[] = [];
    let hadError = false;

    for (const m of pending) {
      try {
        const resolveId = (id: string) => idMapRef.current.get(id) || id;

        if (m.action === 'insert') {
          const rowData = ROW_BUILDERS[m.table]?.(m.data) || m.data;
          delete rowData.id;
          if (rowData.school_id) rowData.school_id = resolveId(rowData.school_id);
          if (rowData.student_id) rowData.student_id = resolveId(rowData.student_id);
          if (rowData.staff_id) rowData.staff_id = resolveId(rowData.staff_id);

          const { data, error } = await supabase.from(m.table).insert(rowData).select().single();
          if (error) throw error;
          if (data) idMapRef.current.set(m.localId, data.id);
        } else if (m.action === 'update') {
          const realId = resolveId(m.localId);
          const rowData = ROW_BUILDERS[m.table]?.(m.data) || m.data;
          delete rowData.id;
          if (rowData.school_id) rowData.school_id = resolveId(rowData.school_id);
          if (rowData.student_id) rowData.student_id = resolveId(rowData.student_id);
          if (rowData.staff_id) rowData.staff_id = resolveId(rowData.staff_id);
          const { error } = await supabase.from(m.table).update(rowData).eq('id', realId);
          if (error) throw error;
        } else if (m.action === 'delete') {
          const realId = resolveId(m.localId);
          const { error } = await supabase.from(m.table).delete().eq('id', realId);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Sync failed for mutation:', m, err);
        remaining.push(m);
        hadError = true;
      }
    }

    setQueue(remaining);
    await idbSaveQueue(remaining);
    syncingRef.current = false;

    if (hadError && remaining.length > 0) {
      setSyncStatus('error');
    } else {
      setSyncStatus('online');
    }

    // Re-fetch fresh data after sync
    if (remaining.length < pending.length) {
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
    }
  }, []);

  // ── Auto-sync when coming online ──
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, queue.length, processQueue]);

  // ── Helper: try online, fallback to offline queue ──
  const tryOnlineOrQueue = useCallback(async (
    table: QueuedMutation['table'],
    action: QueuedMutation['action'],
    data: any,
    localId: string,
    onlineAction: () => Promise<{ success: boolean; serverData?: any }>,
    updateLocal: () => void,
  ) => {
    updateLocal();

    if (navigator.onLine) {
      try {
        const result = await onlineAction();
        if (result.success) return;
      } catch { /* fall through to queue */ }
    }

    enqueue({ table, action, data, localId });
  }, [enqueue]);

  // ── Schools ──
  const addSchool = useCallback(async (s: Omit<School, 'id'>) => {
    const localId = uid();
    const school: School = { ...s, id: localId };
    await tryOnlineOrQueue('schools', 'insert', s, localId,
      async () => {
        const { data, error } = await supabase.from('schools').insert(schoolToRow(s)).select().single();
        if (error) throw error;
        setSchools(prev => prev.map(x => x.id === localId ? mapSchoolFromDB(data) : x));
        return { success: true, serverData: data };
      },
      () => setSchools(prev => [...prev, school]),
    );
  }, [tryOnlineOrQueue]);

  const updateSchool = useCallback(async (s: School) => {
    await tryOnlineOrQueue('schools', 'update', s, s.id,
      async () => {
        const { error } = await supabase.from('schools').update(schoolToRow(s)).eq('id', s.id);
        if (error) throw error;
        return { success: true };
      },
      () => setSchools(prev => prev.map(x => x.id === s.id ? s : x)),
    );
  }, [tryOnlineOrQueue]);

  const deleteSchool = useCallback(async (id: string) => {
    await tryOnlineOrQueue('schools', 'delete', null, id,
      async () => {
        const { error } = await supabase.from('schools').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      },
      () => {
        setSchools(prev => prev.filter(x => x.id !== id));
        setStudents(prev => prev.filter(x => x.schoolId !== id));
        setPayments(prev => prev.filter(x => x.schoolId !== id));
        setExpenses(prev => prev.filter(x => x.schoolId !== id));
        setStaffList(prev => prev.filter(x => x.schoolId !== id));
      },
    );
  }, [tryOnlineOrQueue]);

  // ── Students ──
  const addStudent = useCallback(async (s: Omit<Student, 'id'>) => {
    const localId = uid();
    const student: Student = { ...s, id: localId };
    await tryOnlineOrQueue('students', 'insert', s, localId,
      async () => {
        const { data, error } = await supabase.from('students').insert(studentToRow(s)).select().single();
        if (error) throw error;
        setStudents(prev => prev.map(x => x.id === localId ? mapStudentFromDB(data) : x));
        return { success: true };
      },
      () => setStudents(prev => [...prev, student]),
    );
  }, [tryOnlineOrQueue]);

  const updateStudent = useCallback(async (s: Student) => {
    await tryOnlineOrQueue('students', 'update', s, s.id,
      async () => {
        const { error } = await supabase.from('students').update(studentToRow(s)).eq('id', s.id);
        if (error) throw error;
        return { success: true };
      },
      () => setStudents(prev => prev.map(x => x.id === s.id ? s : x)),
    );
  }, [tryOnlineOrQueue]);

  const deleteStudent = useCallback(async (id: string) => {
    await tryOnlineOrQueue('students', 'delete', null, id,
      async () => {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      },
      () => {
        setStudents(prev => prev.filter(x => x.id !== id));
        setPayments(prev => prev.filter(x => x.studentId !== id));
      },
    );
  }, [tryOnlineOrQueue]);

  // ── Payments ──
  const addPayment = useCallback(async (p: Omit<Payment, 'id'>) => {
    const localId = uid();
    const payment: Payment = { ...p, id: localId };
    await tryOnlineOrQueue('payments', 'insert', p, localId,
      async () => {
        const { data, error } = await supabase.from('payments').insert(paymentToRow(p)).select().single();
        if (error) throw error;
        setPayments(prev => prev.map(x => x.id === localId ? mapPaymentFromDB(data) : x));
        return { success: true };
      },
      () => setPayments(prev => [...prev, payment]),
    );
  }, [tryOnlineOrQueue]);

  const updatePayment = useCallback(async (p: Payment) => {
    await tryOnlineOrQueue('payments', 'update', p, p.id,
      async () => {
        const { error } = await supabase.from('payments').update(paymentToRow(p)).eq('id', p.id);
        if (error) throw error;
        return { success: true };
      },
      () => setPayments(prev => prev.map(x => x.id === p.id ? p : x)),
    );
  }, [tryOnlineOrQueue]);

  const deletePayment = useCallback(async (id: string) => {
    await tryOnlineOrQueue('payments', 'delete', null, id,
      async () => {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      },
      () => setPayments(prev => prev.filter(x => x.id !== id)),
    );
  }, [tryOnlineOrQueue]);

  // ── Expenses ──
  const addExpense = useCallback(async (e: Omit<Expense, 'id'>) => {
    const localId = uid();
    const expense: Expense = { ...e, id: localId };
    await tryOnlineOrQueue('expenses', 'insert', e, localId,
      async () => {
        const { data, error } = await supabase.from('expenses').insert(expenseToRow(e)).select().single();
        if (error) throw error;
        setExpenses(prev => prev.map(x => x.id === localId ? mapExpenseFromDB(data) : x));
        return { success: true };
      },
      () => setExpenses(prev => [...prev, expense]),
    );
  }, [tryOnlineOrQueue]);

  const updateExpense = useCallback(async (e: Expense) => {
    await tryOnlineOrQueue('expenses', 'update', e, e.id,
      async () => {
        const { error } = await supabase.from('expenses').update(expenseToRow(e)).eq('id', e.id);
        if (error) throw error;
        return { success: true };
      },
      () => setExpenses(prev => prev.map(x => x.id === e.id ? e : x)),
    );
  }, [tryOnlineOrQueue]);

  const deleteExpense = useCallback(async (id: string) => {
    await tryOnlineOrQueue('expenses', 'delete', null, id,
      async () => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      },
      () => setExpenses(prev => prev.filter(x => x.id !== id)),
    );
  }, [tryOnlineOrQueue]);

  // ── Staff ──
  const addStaff = useCallback(async (s: Omit<Staff, 'id'>) => {
    const localId = uid();
    const staff: Staff = { ...s, id: localId };
    await tryOnlineOrQueue('staff', 'insert', s, localId,
      async () => {
        const { data, error } = await supabase.from('staff').insert(staffToRow(s)).select().single();
        if (error) throw error;
        setStaffList(prev => prev.map(x => x.id === localId ? mapStaffFromDB(data) : x));
        return { success: true };
      },
      () => setStaffList(prev => [...prev, staff]),
    );
  }, [tryOnlineOrQueue]);

  const updateStaff = useCallback(async (s: Staff) => {
    await tryOnlineOrQueue('staff', 'update', s, s.id,
      async () => {
        const { error } = await supabase.from('staff').update(staffToRow(s)).eq('id', s.id);
        if (error) throw error;
        return { success: true };
      },
      () => setStaffList(prev => prev.map(x => x.id === s.id ? s : x)),
    );
  }, [tryOnlineOrQueue]);

  const deleteStaff = useCallback(async (id: string) => {
    await tryOnlineOrQueue('staff', 'delete', null, id,
      async () => {
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      },
      () => setStaffList(prev => prev.filter(x => x.id !== id)),
    );
  }, [tryOnlineOrQueue]);

  return (
    <DataContext.Provider value={{
      schools, students, payments, expenses, staffList, loading,
      isOnline, syncStatus, pendingSyncCount: queue.length, syncNow: processQueue,
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
