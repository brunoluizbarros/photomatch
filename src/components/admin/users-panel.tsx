'use client';

import { createUser, deleteUser, listUsers, updateUser, updateUserRole } from '@/actions/users';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Role } from '@/lib/auth/require-admin';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';

type Users = Awaited<ReturnType<typeof listUsers>>;
type User = Users[number];

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  photographer: 'Fotógrafo',
  support: 'Atendimento',
};
const ROLES: Role[] = ['admin', 'photographer', 'support'];

const selectClass =
  'h-11 rounded-xl border-2 border-[var(--border)] bg-transparent px-3 text-sm outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]';

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('photographer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setEmail('');
    setPassword('');
    setRole('photographer');
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createUser({ name, email, password, role });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset();
    onCreated();
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Novo usuário"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="new-user-name">Nome</Label>
          <Input
            id="new-user-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-user-email">E-mail</Label>
          <Input
            id="new-user-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-user-password">Senha</Label>
          <Input
            id="new-user-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-user-role">Papel</Label>
          <select
            id="new-user-role"
            className={selectClass}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
        <Button type="submit" variant="accent" disabled={loading} className="w-full">
          {loading ? 'Criando...' : 'Criar usuário'}
        </Button>
      </form>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: { user: User | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preenche o form quando um usuário é selecionado pra edição — sem isso o
  // dialog abriria sempre com os valores da última vez (ou vazio).
  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setError(null);
  }, [user]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    const result = await updateUser(user.id, {
      name,
      email,
      password: password || undefined,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <Dialog open={!!user} onClose={onClose} title="Editar usuário">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="edit-user-name">Nome</Label>
          <Input
            id="edit-user-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-user-email">E-mail</Label>
          <Input
            id="edit-user-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-user-password">Nova senha</Label>
          <Input
            id="edit-user-password"
            type="password"
            minLength={8}
            placeholder="Deixe em branco para manter a atual"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-[var(--destructive)] text-sm">{error}</p>}
        <Button type="submit" variant="accent" disabled={loading} className="w-full">
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </Dialog>
  );
}

export function UsersPanel() {
  const [users, setUsers] = useState<Users | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setUsers(await listUsers());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRoleChange(userId: string, role: Role) {
    setBusyId(userId);
    setRowError(null);
    const result = await updateUserRole(userId, role);
    if (!result.ok) setRowError(result.error);
    await load();
    setBusyId(null);
  }

  async function handleDelete(userId: string, name: string) {
    if (!window.confirm(`Remover o usuário "${name}"? Essa ação não pode ser desfeita.`)) return;
    setBusyId(userId);
    setRowError(null);
    const result = await deleteUser(userId);
    if (!result.ok) setRowError(result.error);
    await load();
    setBusyId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl uppercase">Usuários</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </div>

      {rowError && <p className="text-[var(--destructive)] text-sm">{rowError}</p>}

      {!users ? null : users.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">Nenhum usuário cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{u.name}</p>
                <p className="text-[var(--muted-foreground)] text-sm">
                  {u.email} · desde {format(u.createdAt, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className={selectClass}
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === u.id}
                  onClick={() => setEditingUser(u)}
                  aria-label="Editar usuário"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === u.id}
                  onClick={() => handleDelete(u.id, u.name)}
                  aria-label="Remover usuário"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          load();
        }}
      />

      <EditUserDialog
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={() => {
          setEditingUser(null);
          load();
        }}
      />
    </div>
  );
}
