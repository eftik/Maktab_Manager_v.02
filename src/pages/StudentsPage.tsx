import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { Student } from '@/types';
import { Plus, Search, Edit2, Archive, X, User, Phone, GraduationCap, ArrowLeft } from 'lucide-react';

const StudentsPage = () => {
  const { t } = useLanguage();
  const { schools, students, payments, addStudent, updateStudent } = useData();
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: '', fatherName: '', grade: '', phone: '', monthlyFee: '', enrollmentDate: '', schoolId: '', status: 'active' as const });

  const grades = [...new Set(students.map(s => s.grade))].filter(Boolean);
  const filtered = students
    .filter(s => s.status === 'active')
    .filter(s => !schoolFilter || s.schoolId === schoolFilter)
    .filter(s => !classFilter || s.grade === classFilter)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.fatherName.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => {
    setForm({ name: '', fatherName: '', grade: '', phone: '', monthlyFee: '', enrollmentDate: new Date().toISOString().split('T')[0], schoolId: schools[0]?.id || '', status: 'active' });
    setEditing(null); setShowForm(true);
  };
  const openEdit = (s: Student) => {
    setForm({ name: s.name, fatherName: s.fatherName, grade: s.grade, phone: s.phone, monthlyFee: String(s.monthlyFee), enrollmentDate: s.enrollmentDate, schoolId: s.schoolId, status: s.status });
    setEditing(s); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.schoolId) return;
    const data = { ...form, monthlyFee: Number(form.monthlyFee) || 0 };
    if (editing) updateStudent({ ...editing, ...data });
    else addStudent(data);
    setShowForm(false);
  };

  const handleArchive = (s: Student) => {
    if (confirm(t('confirm'))) updateStudent({ ...s, status: 'archived' });
  };

  const schoolName = (id: string) => schools.find(s => s.id === id)?.name || '';

  // Student profile view
  if (viewStudent) {
    const studentPayments = payments.filter(p => p.studentId === viewStudent.id);
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setViewStudent(null)} className="flex items-center gap-2 text-primary text-sm font-medium">
          <ArrowLeft size={16} /> {t('students')}
        </button>
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full"><User size={24} className="text-primary" /></div>
            <div>
              <h2 className="font-bold text-lg text-foreground">{viewStudent.name}</h2>
              <p className="text-xs text-muted-foreground">{schoolName(viewStudent.schoolId)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs">{t('fatherName')}</span><p className="font-medium text-foreground">{viewStudent.fatherName}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('grade')}</span><p className="font-medium text-foreground">{viewStudent.grade}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('phone')}</span><p className="font-medium text-foreground">{viewStudent.phone}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('monthlyFee')}</span><p className="font-medium text-foreground">؋{viewStudent.monthlyFee.toLocaleString()}</p></div>
          </div>
        </div>
        <h3 className="font-semibold text-foreground">{t('paymentHistory')}</h3>
        {studentPayments.length === 0 ? <p className="text-muted-foreground text-sm">{t('noData')}</p> : (
          <div className="space-y-2">
            {studentPayments.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t(p.month as any)} {p.year}</p>
                  <p className="text-xs text-muted-foreground">؋{p.amount.toLocaleString()}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {t(p.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground" />
        </div>
        <button onClick={openAdd} className="bg-primary text-primary-foreground p-2.5 rounded-xl"><Plus size={20} /></button>
      </div>

      <div className="flex gap-2">
        <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="">{t('allSchools')}</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="">{t('allClasses')}</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noData')}</p>}

      <div className="space-y-3">
        {filtered.map(student => (
          <div key={student.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm" onClick={() => setViewStudent(student)}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">{student.name}</h3>
                <p className="text-xs text-muted-foreground">{student.fatherName}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><GraduationCap size={12} />{student.grade}</span>
                  <span className="flex items-center gap-1"><Phone size={12} />{student.phone}</span>
                </div>
                <p className="text-xs font-medium text-primary">؋{student.monthlyFee.toLocaleString()}/mo</p>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => openEdit(student)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={16} /></button>
                <button onClick={() => handleArchive(student)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Archive size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 space-y-3 animate-in slide-in-from-bottom max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-foreground">{editing ? t('editStudent') : t('addStudent')}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-muted-foreground" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('school')}</label>
              <select value={form.schoolId} onChange={e => setForm({ ...form, schoolId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                <option value="">{t('filterBySchool')}</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {[
              { key: 'name', label: 'name' }, { key: 'fatherName', label: 'fatherName' },
              { key: 'grade', label: 'grade' }, { key: 'phone', label: 'phone' },
              { key: 'monthlyFee', label: 'monthlyFee' }, { key: 'enrollmentDate', label: 'enrollmentDate' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground">{t(f.label as any)}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  type={f.key === 'enrollmentDate' ? 'date' : f.key === 'monthlyFee' ? 'number' : 'text'}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
              </div>
            ))}
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">{t('save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
