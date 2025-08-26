import { useContext, useEffect, useState } from "react";
import { FilterContext } from "../context/FilterContext";
import { getUsersByFilter } from "../repositories/userRepository";

export const useUserFilter = () => {
  const context = useContext(FilterContext);
  const filter = context?.filter || {};
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUsersByFilter(filter);
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        setUsers([]);
      }
    };
    fetchData();
  }, [filter]);

  return users;
};
