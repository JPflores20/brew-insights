import { useState, useEffect } from 'react';

import { collection, query, getDocs, getFirestore, doc, updateDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useAuth } from '../context/auth_context';
export type PermissionType = 'admin' | 'hot_block' | 'cold_block';

export interface UserData {
  uid: string;
  email: string;
  permissions?: PermissionType[];
}

export const useGetUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching users from Firestore...');
      const permissionsCollection = collection(firestore, 'user_permissions');
      const q = query(permissionsCollection);
      const snapshot = await getDocs(q);
      
      console.log('📊 Snapshot size:', snapshot.size);
      const usersList: UserData[] = [];
      snapshot.forEach((doc) => {
        console.log('👤 Found user:', doc.id, doc.data());
        usersList.push({
          uid: doc.id,
          email: doc.data().email || '',
          permissions: doc.data().permissions || [],
        });
      });
      
      console.log('✅ Users loaded:', usersList);
      setUsers(usersList);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Error fetching users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserPermissions = async (uid: string, permissions: PermissionType[], email?: string) => {
    try {
      const db = getFirestore();
      const userRef = doc(firestore, 'user_permissions', uid);
      
      const data: any = { permissions };
      if (email) {
        data.email = email;
      }
      
      await setDoc(userRef, data, { merge: true });
      
      // Update local state
      setUsers(users.map(u => u.uid === uid ? { ...u, permissions } : u));
      return true;
    } catch (err) {
      console.error('Error updating permissions:', err);
      setError(err instanceof Error ? err.message : 'Error updating permissions');
      return false;
    }
  };

  return { users, loading, error, updateUserPermissions, refetch: fetchUsers };
};
