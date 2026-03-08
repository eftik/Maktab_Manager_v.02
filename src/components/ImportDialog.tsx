import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, FileText, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import type { Student, Payment, FeeType } from '@/types';
import * as XLSX from 'xlsx';

type ImportType = 'students' | 'payments';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ParsedStudent {
  name: string; idNumber: string; grade: string; parentName: string;
  parentPhone: string; schoolId: string; entryDate: string;
}

interface ParsedPayment {
  studentId: string; schoolId: string; feeType: FeeType;
  amount: number; finalAmount: number; date: string; billNumber: string; note: string;
}

const ImportDialog = ({ open, onClose }: Props) => {
  const { t } = useLanguage();
  const { schools, students, addStudent, addPayment } = useData();
  const [importType, setImportType] = useState<ImportType>('students');
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => { setPreview([]); setError(''); setImported(0); };

  const parseFile = async (file: File) => {
    reset();
    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (rows.length === 0) { setError('File is empty'); return; }
        setPreview(rows.slice(0, 10));
      } else {
        setError('Supported formats: CSV, XLSX, XLS');
      }
    } catch {
      setError('Failed to parse file');
    }
  };

  const handleImport = async () => {
    if (!fileRef.current?.files?.[0]) return;
    const file = fileRef.current.files[0];
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    let count = 0;

    if (importType === 'students') {
      for (const row of rows) {
        const name = row['name'] || row['Name'] || row['نام'] || '';
        const idNumber = row['idNumber'] || row['ID'] || row['شماره تذکره'] || '';
        const grade = row['grade'] || row['Grade'] || row['صنف'] || '';
        const parentName = row['parentName'] || row['Parent Name'] || row['نام والدین'] || '';
        const parentPhone = row['parentPhone'] || row['Parent Phone'] || row['تلفن والدین'] || '';
        const schoolName = row['school'] || row['School'] || row['مکتب'] || '';
        const entryDate = row['entryDate'] || row['Entry Date'] || row['تاریخ شمولیت'] || new Date().toISOString().split('T')[0];
        const school = schools.find(s => s.name.toLowerCase() === schoolName.toLowerCase());

        if (name.trim() && school) {
          addStudent({
            name, idNumber, grade, parentName, parentPhone,
            discountType: 'none', discountValue: 0,
            entryDate, schoolId: school.id, status: 'active',
          });
          count++;
        }
      }
    } else {
      for (const row of rows) {
        const studentName = row['student'] || row['Student'] || row['شاگرد'] || '';
        const feeType = (row['feeType'] || row['Fee Type'] || row['نوع فیس'] || 'tuition') as FeeType;
        const amount = Number(row['amount'] || row['Amount'] || row['مبلغ'] || 0);
        const date = row['date'] || row['Date'] || row['تاریخ'] || new Date().toISOString().split('T')[0];
        const billNumber = row['billNumber'] || row['Bill Number'] || row['شماره بل'] || '';
        const note = row['note'] || row['Note'] || row['یادداشت'] || '';
        const student = students.find(s => s.name.toLowerCase() === studentName.toLowerCase());

        if (student && amount > 0) {
          addPayment({
            studentId: student.id, schoolId: student.schoolId, feeType,
            amount, discount: 0, finalAmount: amount, date, billNumber, note,
          });
          count++;
        }
      }
    }
    setImported(count);
    setPreview([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">{t('importData' as any) || 'Import Data'}</h2>
          <button onClick={() => { reset(); onClose(); }}><X size={20} className="text-muted-foreground" /></button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setImportType('students'); reset(); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border ${importType === 'students' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
            {t('students')}
          </button>
          <button onClick={() => { setImportType('payments'); reset(); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border ${importType === 'payments' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>
            {t('fees')}
          </button>
        </div>

        <div className="bg-muted/50 border border-border rounded-xl p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">{importType === 'students' ? 'Student columns:' : 'Payment columns:'}</p>
          {importType === 'students' ? (
            <p>name, idNumber, grade, parentName, parentPhone, school, entryDate</p>
          ) : (
            <p>student, feeType (tuition/transportation/registration), amount, date, billNumber, note</p>
          )}
        </div>

        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => e.target.files?.[0] && parseFile(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 mx-auto text-muted-foreground hover:text-foreground">
            <Upload size={24} />
            <span className="text-sm">CSV, XLSX, XLS</span>
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center gap-2 text-destructive text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {preview.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Preview ({preview.length} rows):</p>
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted">
                    {Object.keys(preview[0]).map(k => <th key={k} className="px-2 py-1 text-left text-muted-foreground">{k}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {Object.values(row).map((v, j) => <td key={j} className="px-2 py-1 text-foreground">{String(v)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleImport} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium">
              {t('importData' as any) || 'Import'}
            </button>
          </div>
        )}

        {imported > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center text-sm font-medium text-primary">
            ✅ {imported} records imported successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportDialog;
