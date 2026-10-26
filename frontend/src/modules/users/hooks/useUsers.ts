import { useState, useEffect } from 'react';
import { userService, type UserItem } from '../services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    userService
      .getUsers()
      .then((data) => {
        if (mounted) setUsers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { users, loading };
};

export default useUsers;
