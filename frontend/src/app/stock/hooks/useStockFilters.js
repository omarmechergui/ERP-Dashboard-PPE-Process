/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";

export const useStockFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // all, low_stock, out_of_stock, reserved
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, selectedSupplier, availabilityFilter, limit]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    selectedSupplier,
    setSelectedSupplier,
    availabilityFilter,
    setAvailabilityFilter,
    page,
    setPage,
    limit,
    setLimit
  };
};
