/**
 * Página de Administración (Admin)
 * --------------------------------
 * Esta página permite a los usuarios con rol 'admin' gestionar los permisos 
 * de acceso de otros usuarios de la aplicación (e.g. acceso a Hot Block, Cold Block o ser Admin).
 * Utiliza hooks personalizados para obtener la lista de usuarios desde Firebase Firestore.
 */
import React, { useState, useMemo } from 'react';
import { useGetUsers, type PermissionType } from '@/hooks/use_get_users';
import { useAuth } from '@/context/auth_context';
import { Loader2, AlertCircle, Users, Check, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from "@/components/layout/dashboard_layout";
import { AnimatedPage } from "@/components/layout/animated_page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { UserPlus, Search } from 'lucide-react';
import { useToast } from "@/hooks/use_toast";

const PERMISSION_LABELS: Record<PermissionType, string> = {
  admin: 'Admin',
  hot_block: 'Hot Block',
  cold_block: 'Cold Block',
};

const Admin: React.FC = () => {
  // Obtiene el estado del usuario actualmente autenticado
  const { user } = useAuth();
  // Obtiene la lista completa de usuarios y las funciones para actualizarlos desde nuestro hook personalizado
  const { users, loading, error, updateUserPermissions, refetch } = useGetUsers();
  
  // Estado local para manejar los permisos mientras se actualizan en la UI (optimistic update)
  const [permissions, setPermissions] = useState<Record<string, PermissionType[]>>({});
  // Estados para mostrar indicadores de "Guardando..." o "Guardado" por cada usuario (basado en su UID)
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  
  // Estado para búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para creación de usuario
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPermissions, setNewPermissions] = useState<PermissionType[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createError, setCreateError] = useState('');
  const { toast } = useToast();
  const { createUserAccount } = useGetUsers();

  // Calcula los permisos del usuario actual logueado para verificar si es 'admin'
  const currentUserPermissions = useMemo(() => {
    if (!user?.uid) return [];
    const currentUserDoc = users.find(u => u.uid === user.uid);
    return currentUserDoc?.permissions || [];
  }, [users, user?.uid]);

  // Booleano que indica si el usuario actual es administrador
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

  /**
   * handleTogglePermission
   * Función que se ejecuta al encender o apagar un switch de permiso para un usuario.
   * @param uid El ID del usuario al que se le cambiará el permiso.
   * @param permission El permiso específico a activar/desactivar ('admin', 'hot_block', 'cold_block').
   */
  const handleTogglePermission = async (uid: string, permission: PermissionType) => {
    const userToUpdate = users.find(u => u.uid === uid);
    // Tomamos los permisos actuales del usuario, ya sea del estado local o de Firestore
    const userPerms = permissions[uid] || (userToUpdate?.permissions || []);
    
    let newPerms: PermissionType[];
    // Si el usuario ya tiene el permiso, se lo quitamos
    if (userPerms.includes(permission)) {
      newPerms = userPerms.filter(p => p !== permission);
    } else {
      // Si no lo tiene, se lo agregamos
      // Regla de negocio especial: Si se le da permiso de 'admin', automáticamente
      // obtiene acceso a todo lo demás ('hot_block', 'cold_block').
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (newPermissions.length === 0) {
      setCreateError('Debes asignar al menos un permiso al usuario.');
      return;
    }

    if (newPassword.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsCreatingUser(true);
    const result = await createUserAccount(newEmail, newPassword, newPermissions);
    setIsCreatingUser(false);

    if (result.success) {
      toast({
        title: "Usuario Creado",
        description: "El usuario ha sido registrado exitosamente.",
        className: "bg-primary text-primary-foreground border-none"
      });
      setShowAddUser(false);
      setNewEmail('');
      setNewPassword('');
      setNewPermissions([]);
    } else {
      setCreateError(result.error || 'Error desconocido al crear usuario');
    }
  };

  const toggleNewPermission = (permission: PermissionType) => {
    setNewPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        if (permission === 'admin') {
          return Array.from(new Set([...prev, 'admin', 'hot_block', 'cold_block']));
        }
        return [...prev, permission];
      }
    });
  };

  // Render principal de la vista de administrador
  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              Gestión de Permisos de Usuarios
            </h1>
            <p className="text-muted-foreground mt-2">
              Administra los permisos de acceso de los usuarios registrados en la plataforma.
            </p>
          </div>
          <Button onClick={() => setShowAddUser(true)} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Agregar Usuario
          </Button>
        </div>

        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Buscar por correo electrónico o ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
              users
                .filter(u => 
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  u.uid.includes(searchQuery)
                )
                .map((userItem) => {
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

      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Registra un nuevo usuario y asigna sus permisos de acceso.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Correo Electrónico</label>
                <Input 
                  type="email" 
                  required 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@ab-inbev.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contraseña Temporal</label>
                <Input 
                  type="password" 
                  required 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              
              <div className="pt-2">
                <label className="text-sm font-medium mb-3 block">Permisos de Acceso <span className="text-destructive">*</span></label>
                <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
                  {(Object.keys(PERMISSION_LABELS) as PermissionType[]).map((permission) => (
                    <div key={`new-${permission}`} className="flex items-center justify-between">
                      <label htmlFor={`new-${permission}`} className="text-sm font-medium cursor-pointer">
                        {PERMISSION_LABELS[permission]}
                      </label>
                      <Switch
                        id={`new-${permission}`}
                        checked={newPermissions.includes(permission)}
                        onCheckedChange={() => toggleNewPermission(permission)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {createError && (
              <div className="text-sm text-destructive font-medium p-2 bg-destructive/10 rounded border border-destructive/20">
                {createError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddUser(false)} disabled={isCreatingUser}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingUser}>
                {isCreatingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creando...
                  </>
                ) : (
                  'Crear Usuario'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Admin;
