import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Trash2, Shield, ShieldCheck, X } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

interface AdminRow {
  id: string;
  user_id: string;
  role: 'owner' | 'admin';
  school_id: string | null;
  display_name: string;
  created_at: string;
}

const AdminsPage = () => {
  const { t } = useLanguage();
  const { isOwner } = useAuth();
  const { schools } = useData();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newSchoolId, setNewSchoolId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    const { data } = await supabase.from('admins').select('*').order('created_at');
    if (data) setAdmins(data as AdminRow[]);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Use edge function to create user (owner can't sign up others directly from client)
    const { data: funcData, error: funcError } = await supabase.functions.invoke('create-admin', {
      body: { email: newEmail.trim(), password: newPassword, displayName: newName.trim(), schoolId: newSchoolId || null },
    });

    if (funcError || funcData?.error) {
      setError(funcData?.error || funcError?.message || 'Failed to create admin');
      setLoading(false);
      return;
    }

    setShowForm(false);
    setNewEmail(''); setNewPassword(''); setNewName(''); setNewSchoolId('');
    setLoading(false);
    fetchAdmins();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const admin = admins.find(a => a.id === deleteId);
    if (!admin || admin.role === 'owner') return;

    await supabase.functions.invoke('delete-admin', {
      body: { userId: admin.user_id },
    });

    setDeleteId(null);
    fetchAdmins();
  };

  if (!isOwner) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 text-destructive rounded-2xl p-4 text-center text-sm font-medium">
          {t('noAccess' as any)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-foreground">{t('admins' as any)}</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5"
        >
          <UserPlus size={16} /> {t('addAdmin' as any)}
        </button>
      </div>

      {/* Admin List */}
      <div className="space-y-2">
        {admins.map(a => {
          const school = schools.find(s => s.id === a.school_id);
          return (
            <div key={a.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${a.role === 'owner' ? 'bg-primary/10' : 'bg-accent'}`}>
                {a.role === 'owner' ? <ShieldCheck size={20} className="text-primary" /> : <Shield size={20} className="text-accent-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{a.display_name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground">
                  {a.role === 'owner' ? t('owner' as any) : school?.name || t('allSchools')}
                </p>
              </div>
              {a.role !== 'owner' && (
                <button
                  onClick={() => setDeleteId(a.id)}
                  className="p-2 rounded-xl text-destructive hover:bg-destructive/10 min-h-0 min-w-0"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
        {admins.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">{t('noData')}</p>
        )}
      </div>

      {/* Create Admin Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">{t('addAdmin' as any)}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 min-h-0 min-w-0"><X size={18} className="text-muted-foreground" /></button>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-3 py-2 font-medium">{error}</div>
            )}

            <form onSubmit={createAdmin} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('name')}</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} required
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('email' as any)}</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('password' as any)}</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t('school')}</label>
                <select value={newSchoolId} onChange={e => setNewSchoolId(e.target.value)} required
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground mt-1 focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">{t('filterBySchool')}</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                {loading ? '...' : t('save')}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('confirm')}
        message={t('deleteConfirm')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default AdminsPage;
