import React, { createContext, useState } from "react";

export const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filter, setFilter] = useState({
    status: null,
    dateRange: { from: null, to: null },
  });

  const updateFilter = (newFilter) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  const resetFilter = () => {
    setFilter({ status: null, dateRange: { from: null, to: null } });
  };

  return (
    <FilterContext.Provider value={{ filter, updateFilter, resetFilter }}>
      {children}
    </FilterContext.Provider>
  );
};
