import React, { createContext, useState, useContext } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    status: null,
    dateRange: { from: null, to: null }
  });

  const updateFilter = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilter = () => {
    setFilters({
      status: null,
      dateRange: { from: null, to: null }
    });
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilter, resetFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};