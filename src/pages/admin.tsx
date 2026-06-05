import React, { useState, useMemo } from 'react';
import { useGetUsers, type PermissionType } from '@/hooks/use_get_users';
import { useAuth } from '@/context/auth_context';
import { Loader2, AlertCircle, Users, Check } from 'lucide-react';

const PERMISSION_LABELS: Record<PermissionType, string> = {
  admin: 'Admin',
  hot_block: 'Hot Block',
  cold_block: 'Cold Block',
};

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { users, loading, error, updateUserPermissions, refetch } = useGetUsers();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-400">No autorizado</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso denegado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            No tienes permisos de administrador.
          </p>
          
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded text-left text-xs text-gray-700 dark:text-gray-300 space-y-2 font-mono border border-gray-300 dark:border-gray-600">
            <div><strong>Tu UID:</strong><br/><span className="break-all text-blue-600 dark:text-blue-400">{user?.uid}</span></div>
            <div><strong>Tu Email:</strong><br/>{user?.email}</div>
            <div><strong>Usuarios en Firestore:</strong> {users.length}</div>
            {loading && <div className="text-blue-600 dark:text-blue-400">⏳ Cargando...</div>}
            {error && <div className="text-red-600 dark:text-red-400">❌ {error}</div>}
            {users.length > 0 && (
              <div>
                <strong>UIDs que coinciden:</strong>
                <ul className="mt-2 space-y-1 bg-gray-900 p-2 rounded">
                  {users.map(u => {
                    const matches = u.uid === user?.uid;
                    return (
                      <li key={u.uid} className={matches ? 'text-green-400 font-bold' : 'text-gray-400'}>
                        {matches ? '✅ ' : '  '}{u.uid} → {u.permissions?.join(', ') || 'sin permisos'}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleTogglePermission = (uid: string, permission: PermissionType) => {
    const userPerms = permissions[uid] || (users.find(u => u.uid === uid)?.permissions || []);
    const newPerms = userPerms.includes(permission)
      ? userPerms.filter(p => p !== permission)
      : [...userPerms, permission];
    setPermissions({ ...permissions, [uid]: newPerms });
  };

  const handleSavePermissions = async (uid: string) => {
    setSaving(uid);
    try {
      const user = users.find(u => u.uid === uid);
      const userPerms = permissions[uid] || (user?.permissions || []);
      const success = await updateUserPermissions(uid, userPerms, user?.email);
      if (success) {
        setSaved(uid);
        setTimeout(() => setSaved(null), 2000);
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8" />
            Gestión de Permisos de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra los permisos de acceso de los usuarios registrados
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Error al cargar usuarios</h3>
              <p className="text-red-700 dark:text-red-200 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {users.length === 0 ? (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400">
                No hay usuarios registrados
              </div>
            ) : (
              users.map((userItem) => {
                const userPerms = permissions[userItem.uid] ?? (userItem.permissions || []);
                return (
                  <div
                    key={userItem.uid}
                    className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {userItem.email}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          ID: {userItem.uid}
                        </p>
                      </div>
                      {saved === userItem.uid && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">Guardado</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-4">
                      {(Object.keys(PERMISSION_LABELS) as PermissionType[]).map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={userPerms.includes(permission)}
                            onChange={() => handleTogglePermission(userItem.uid, permission)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {PERMISSION_LABELS[permission]}
                          </span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSavePermissions(userItem.uid)}
                      disabled={saving === userItem.uid}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      {saving === userItem.uid ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar cambios'
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {users.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">Total de usuarios:</span> {users.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
