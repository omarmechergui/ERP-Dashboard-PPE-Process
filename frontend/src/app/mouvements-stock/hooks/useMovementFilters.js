import { useState } from "react";

export const useMovementFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all"); // 'today', 'week', 'month', 'all'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const handleSetSearchTerm = (val) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleSetTypeFilter = (val) => {
    setTypeFilter(val);
    setPage(1);
  };

  const handleSetDateRange = (val) => {
    setDateRange(val);
    setPage(1);
  };

  return {
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    typeFilter,
    setTypeFilter: handleSetTypeFilter,
    dateRange,
    setDateRange: handleSetDateRange,
    page,
    setPage,
    limit,
    setLimit
  };
};