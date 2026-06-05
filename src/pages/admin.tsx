import React, { useState, useMemo } from 'react';
import { useGetUsers, type PermissionType } from '@/hooks/use_get_users';
import { useAuth } from '@/context/auth_context';
import { Loader2, AlertCircle, Users, Check, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { AnimatedPage } from "@/components/layout/animated_page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const PERMISSION_LABELS: Record<PermissionType, string> = {
  admin: 'Admin',
  hot_block: 'Hot Block',
  cold_block: 'Cold Block',
};

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { users, loading, error, updateUserPermissions, refetch } = useGetUsers();
  const [permissions, setPermissions] = useState<Record<string, PermissionType[]>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const currentUserPermissions = useMemo(() => {
    if (!user?.uid) return [];
    const currentUserDoc = users.find(u => u.uid === user.uid);
    return currentUserDoc?.permissions || [];
  }, [users, user?.uid]);

  const isAdmin = currentUserPermissions.includes('admin');

  if (!user?.uid) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">No autorizado</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <AnimatedPage>
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
            <div className="text-center max-w-md">
              <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Acceso denegado
              </h1>
              <p className="text-muted-foreground mb-6">
                No tienes permisos de administrador.
              </p>
              
              <div className="mt-8 p-4 bg-muted rounded-lg text-left text-xs text-muted-foreground space-y-2 font-mono border border-border">
                <div><strong>Tu UID:</strong><br/><span className="break-all text-primary">{user?.uid}</span></div>
                <div><strong>Tu Email:</strong><br/>{user?.email}</div>
                <div><strong>Usuarios en Firestore:</strong> {users.length}</div>
                {loading && <div className="text-primary">⏳ Cargando...</div>}
                {error && <div className="text-destructive">❌ {error}</div>}
              </div>
            </div>
          </div>
        </AnimatedPage>
      </DashboardLayout>
    );
  }

  const handleTogglePermission = async (uid: string, permission: PermissionType) => {
    const userToUpdate = users.find(u => u.uid === uid);
    const userPerms = permissions[uid] || (userToUpdate?.permissions || []);
    
    let newPerms: PermissionType[];
    if (userPerms.includes(permission)) {
      newPerms = userPerms.filter(p => p !== permission);
    } else {
      if (permission === 'admin') {
        const permsToAdd: PermissionType[] = ['admin', 'hot_block', 'cold_block'];
        newPerms = Array.from(new Set([...userPerms, ...permsToAdd]));
      } else {
        newPerms = [...userPerms, permission];
      }
    }
    
    setPermissions({ ...permissions, [uid]: newPerms });
    
    setSaving(uid);
    try {
      const success = await updateUserPermissions(uid, newPerms, userToUpdate?.email);
      if (success) {
        setSaved(uid);
        setTimeout(() => setSaved(null), 2000);
      }
    } finally {
      setSaving(null);
    }
  };



  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Gestión de Permisos de Usuarios
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra los permisos de acceso de los usuarios registrados en la plataforma.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive">Error al cargar usuarios</h3>
              <p className="text-destructive/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {users.length === 0 ? (
              <div className="p-8 text-center bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No hay usuarios registrados</p>
              </div>
            ) : (
              users.map((userItem) => {
                const userPerms = permissions[userItem.uid] ?? (userItem.permissions || []);
                return (
                  <Card key={userItem.uid} className="flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 hover:border-primary/50 transition-colors">
                    <div className="flex-1 min-w-0 md:mr-6">
                      <h3 className="text-lg font-semibold truncate text-foreground" title={userItem.email}>
                        {userItem.email}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate" title={userItem.uid}>
                        ID: {userItem.uid}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 md:gap-6 flex-1 justify-end">
                      {(Object.keys(PERMISSION_LABELS) as PermissionType[]).map((permission) => (
                        <div key={permission} className="flex items-center gap-2">
                          <Switch
                            id={`${userItem.uid}-${permission}`}
                            checked={userPerms.includes(permission)}
                            disabled={saving === userItem.uid}
                            onCheckedChange={() => handleTogglePermission(userItem.uid, permission)}
                          />
                          <label htmlFor={`${userItem.uid}-${permission}`} className="text-sm font-medium text-foreground cursor-pointer select-none">
                            {PERMISSION_LABELS[permission]}
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-end min-w-[120px] mt-4 md:mt-0 ml-auto border-t border-border pt-4 md:border-none md:pt-0">
                      {saving === userItem.uid ? (
                        <div className="flex items-center gap-2 text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm font-medium">Guardando...</span>
                        </div>
                      ) : saved === userItem.uid ? (
                        <div className="flex items-center gap-2 text-green-500">
                          <Check className="w-4 h-4" />
                          <span className="text-sm font-medium">Guardado</span>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {users.length > 0 && (
          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg inline-block">
            <p className="text-sm text-primary">
              <span className="font-semibold">Total de usuarios:</span> {users.length}
            </p>
          </div>
        )}
      </AnimatedPage>
    </DashboardLayout>
  );
};

export default Admin;
