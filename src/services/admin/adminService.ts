export const getAllUsers = async (adminId: string) => {
  const response = await fetch('/api/admin/users', {
    headers: {
      'x-admin-id': adminId
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

export const updateUserRole = async (userId: string, newRole: string, adminId: string) => {
  const response = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-id': adminId
    },
    body: JSON.stringify({ role: newRole })
  });
  if (!response.ok) {
    throw new Error('Failed to update role');
  }
};
