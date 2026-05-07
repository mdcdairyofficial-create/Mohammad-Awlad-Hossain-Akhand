import React, { useEffect, useState } from 'react';
import { UserRole } from '../types';
import { fetchWithAuth } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  user_type: UserRole;
  role?: UserRole;
  country?: string;
  district?: string;
}

const AdminDashboard: React.FC<{ currentUser: { role: UserRole; country?: string; district?: string } }> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let apiUrl = `/api/admin/managed-users?role=${currentUser.role}`;
        
        if (currentUser.district) apiUrl += `&district=${encodeURIComponent(currentUser.district)}`;
        if (currentUser.country) apiUrl += `&country=${encodeURIComponent(currentUser.country)}`;

        const response = await fetchWithAuth(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          // API returns user_type, map it back to role for display
          setUsers(data.map((u: any) => ({ ...u, role: u.user_type })));
        } else {
          console.error("API error fetching users:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">অ্যাডমিন ড্যাশবোর্ড ({currentUser.role})</h1>
      {loading ? (
        <p>লোড হচ্ছে...</p>
      ) : (
        <div className="bg-white shadow rounded-lg p-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left">নাম</th>
                <th className="text-left">ইমেইল</th>
                <th className="text-left">রোল</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
