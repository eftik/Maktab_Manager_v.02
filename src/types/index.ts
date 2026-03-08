export interface School {
  id: string;
  name: string;
  city: string;
  phone: string;
  address: string;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  grade: string;
  phone: string;
  monthlyFee: number;
  enrollmentDate: string;
  status: 'active' | 'archived';
  schoolId: string;
}

export interface Payment {
  id: string;
  studentId: string;
  schoolId: string;
  month: string;
  year: number;
  amount: number;
  status: 'paid' | 'unpaid';
  datePaid?: string;
}

export interface Expense {
  id: string;
  type: string;
  amount: number;
  date: string;
  note: string;
  schoolId: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  schoolId: string;
}

export type Language = 'en' | 'da';
