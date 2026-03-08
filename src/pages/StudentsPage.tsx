import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import type { Student } from '@/types';
import { Plus, Search, Edit2, Archive, RotateCcw, Trash2, X, User, ArrowLeft } from 'lucide-react';
import ShamsiDatePicker from '@/components/ShamsiDatePicker';
import { formatShamsi } from '@/lib/shamsi';
import { fmtAFN } from '@/lib/helpers';
import ConfirmDialog from '@/components/ConfirmDialog';

const emptyForm = () => ({
  name: '', idNumber: '', grade: '', parentName: '', parentPhone: '',
  discountType: 'none' as Student['discountType'], discountValue: 0,
  entryDate: new Date().toISOString().split('T')[0], schoolId: '', status: 'active' as Student['status'],
});

const StudentsPage = () => {
  const { t, lang } = useLanguage();
  const { schools, students, payments, addStudent, updateStudent, deleteStudent } = useData();
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const grades = [...new Set(students.map(s => s.grade))].filter(Boolean);
  const filtered = students
    .filter(s => showArchived ? s.status === 'archived' : s.status === 'active')
    .filter(s => !schoolFilter || s.schoolId === schoolFilter)
    .filter(s => !classFilter || s.grade === classFilter)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.parentName.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ ...emptyForm(), schoolId: schools[0]?.id || '' }); setEditing(null); setShowForm(true); };
  const openEdit = (s: Student) => {
    setForm({ name: s.name, idNumber: s.idNumber, grade: s.grade, parentName: s.parentName,
      parentPhone: s.parentPhone, discountType: s.discountType, discountValue: s.discountValue,
      entryDate: s.entryDate, schoolId: s.schoolId, status: s.status });
    setEditing(s); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.schoolId) return;
    if (editing) updateStudent({ ...editing, ...form });
    else addStudent(form);
    setShowForm(false);
  };

  const schoolName = (id: string) => schools.find(s => s.id === id)?.name || '';

  if (viewStudent) {
    const sp = payments.filter(p => p.studentId === viewStudent.id);
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
            <div><span className="text-muted-foreground text-xs">{t('idNumber')}</span><p className="font-medium text-foreground">{viewStudent.idNumber}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('grade')}</span><p className="font-medium text-foreground">{viewStudent.grade}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('parentName')}</span><p className="font-medium text-foreground">{viewStudent.parentName}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('parentPhone')}</span><p className="font-medium text-foreground">{viewStudent.parentPhone}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('discountType')}</span><p className="font-medium text-foreground">{t(viewStudent.discountType)}</p></div>
            <div><span className="text-muted-foreground text-xs">{t('entryDate')}</span><p className="font-medium text-foreground">{formatShamsi(viewStudent.entryDate, lang)}</p></div>
          </div>
        </div>
        <h3 className="font-semibold text-foreground">{t('paymentHistory')}</h3>
        {sp.length === 0 ? <p className="text-muted-foreground text-sm">{t('noData')}</p> : (
          <div className="space-y-2">
            {sp.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t(p.feeType)} — {fmtAFN(p.finalAmount)}</p>
                  <p className="text-xs text-muted-foreground">{formatShamsi(p.date, lang)} · #{p.billNumber}</p>
                </div>
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

      <div className="flex gap-2 flex-wrap">
        <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}
          className="flex-1 min-w-[120px] rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="">{t('allSchools')}</option>
          {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="flex-1 min-w-[100px] rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="">{t('allClasses')}</option>
          {grades.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <button onClick={() => setShowArchived(!showArchived)}
          className={`px-3 py-2 rounded-xl text-xs font-medium border ${showArchived ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
          {showArchived ? t('archivedStudents') : t('activeStudents')}
        </button>
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">{t('noData')}</p>}

      <div className="space-y-3">
        {filtered.map(student => {
          const sp = payments.filter(p => p.studentId === student.id);
          const totalPaid = sp.reduce((sum, p) => sum + p.finalAmount, 0);
          return (
            <div key={student.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm" onClick={() => setViewStudent(student)}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{student.name}</h3>
                  <p className="text-xs text-muted-foreground">{student.parentName} · {student.grade}</p>
                  <p className="text-xs text-muted-foreground">{schoolName(student.schoolId)}</p>
                  <p className="text-xs font-medium text-primary">{t('totalPaid')}: {fmtAFN(totalPaid)}</p>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(student)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Edit2 size={16} /></button>
                  <button onClick={() => updateStudent({ ...student, status: student.status === 'active' ? 'archived' : 'active' })}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                    {student.status === 'active' ? <Archive size={16} /> : <RotateCcw size={16} />}
                  </button>
                  <button onClick={() => setDeleteId(student.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog open={!!deleteId} title={t('delete')} message={t('deleteConfirm')}
        onConfirm={() => { if (deleteId) deleteStudent(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} />

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
            {[{k:'name',l:'name'},{k:'idNumber',l:'idNumber'},{k:'grade',l:'grade'},{k:'parentName',l:'parentName'},{k:'parentPhone',l:'parentPhone'}].map(f => (
              <div key={f.k}>
                <label className="text-xs font-medium text-muted-foreground">{t(f.l as any)}</label>
                <input value={(form as any)[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('discountType')}</label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground">
                <option value="none">{t('none')}</option>
                <option value="percentage">{t('percentage')}</option>
                <option value="free">{t('free')}</option>
              </select>
            </div>
            {form.discountType === 'percentage' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('discountValue')} (%)</label>
                <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('entryDate')}</label>
              <ShamsiDatePicker value={form.entryDate} onChange={d => setForm({ ...form, entryDate: d })} />
            </div>
            <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">{t('save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentsPage;
