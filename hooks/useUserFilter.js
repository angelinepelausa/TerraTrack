import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import firestore from '@react-native-firebase/firestore';

export const useUserFilter = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { filters } = useFilter();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let query = firestore().collection('users');

        // Apply status filter
        if (filters.status && filters.status !== 'All') {
          query = query.where('status', '==', filters.status.toLowerCase());
        }

        const snapshot = await query.get();
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Apply date range filter
        let filteredUsers = usersData;
        if (filters.dateRange.from || filters.dateRange.to) {
          filteredUsers = usersData.filter(user => {
            if (!user.createdAt) return true;
            
            const userDate = user.createdAt.toDate();
            let fromMatch = true;
            let toMatch = true;

            if (filters.dateRange.from) {
              fromMatch = userDate >= filters.dateRange.from;
            }

            if (filters.dateRange.to) {
              const toDate = new Date(filters.dateRange.to);
              toDate.setHours(23, 59, 59, 999); // End of the day
              toMatch = userDate <= toDate;
            }

            return fromMatch && toMatch;
          });
        }

        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filters]);

  return users;
};