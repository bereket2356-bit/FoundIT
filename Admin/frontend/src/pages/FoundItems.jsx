import { AlertCircle, ArrowUpDown, Box, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import API, { BASE_URL } from "../api";
import UserCell from "../components/UserCell";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const FoundItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter, Sort state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState({ category: "", status: "" });
  const [showFilters, setShowFilters] = useState(false);

  const [sort, setSort] = useState({ field: "createdAt", dir: "desc" });
  const [showSort, setShowSort] = useState(false);

  const debouncedSearchHandler = useCallback(
    debounce((query) => setDebouncedSearch(query), 500),
    [],
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debouncedSearchHandler(e.target.value);
  };

  const fetchFoundItems = async () => {
    try {
      setLoading(true);
      let query = `/items?type=found&sortBy=${sort.field}&sortDir=${sort.dir}`;
      if (debouncedSearch) query += `&q=${encodeURIComponent(debouncedSearch)}`;
      if (filters.category)
        query += `&category=${encodeURIComponent(filters.category)}`;
      if (filters.status)
        query += `&status=${encodeURIComponent(filters.status)}`;

      const res = await API.get(query);
      setItems(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoundItems();
  }, [debouncedSearch, filters, sort]);

  const resetFilters = () => {
    setFilters({ category: "", status: "" });
    setSort({ field: "createdAt", dir: "desc" });
    setSearch("");
    setDebouncedSearch("");
  };

  const activeFilterCount =
    (filters.category ? 1 : 0) + (filters.status ? 1 : 0);

  const total = items.length;
  const unclaimed = items.filter((i) => i.status === "open").length;
  const returnRate =
    total === 0 ? 0 : Math.round(((total - unclaimed) / total) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Found Items
          </h1>
          <p className="text-slate-500">
            Items reported as found and awaiting claims.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
            <span className="text-lg leading-none">+</span> Report Found Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            TOTAL FOUND
          </div>
          <div className="text-3xl font-bold text-slate-800">{total}</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            UNCLAIMED
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-2">
            {unclaimed}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            RETURN RATE
          </div>
          <div className="text-3xl font-bold text-slate-800 mb-3">
            {returnRate}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${returnRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1 items-center">
            <div className="relative max-w-xs w-full">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>

            {/* Filter Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilters || activeFilterCount > 0 ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                <SlidersHorizontal size={16} />
                Filters{" "}
                {activeFilterCount > 0 && (
                  <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 shadow-lg rounded-xl p-4 z-10">
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      className="w-full border-slate-200 rounded-lg text-sm p-2"
                      value={filters.category}
                      onChange={(e) =>
                        setFilters({ ...filters, category: e.target.value })
                      }
                    >
                      <option value="">All Categories</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Keys">Keys</option>
                      <option value="Wallet/ID">Wallet/ID</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Status
                    </label>
                    <select
                      className="w-full border-slate-200 rounded-lg text-sm p-2"
                      value={filters.status}
                      onChange={(e) =>
                        setFilters({ ...filters, status: e.target.value })
                      }
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open (Unclaimed)</option>
                      <option value="pending">Pending Claim</option>
                      <option value="resolved">Resolved / Claimed</option>
                    </select>
                  </div>
                  <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm w-full"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Button */}
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
              >
                <ArrowUpDown size={16} />
                Sort
              </button>

              {showSort && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-2 z-10">
                  <button
                    onClick={() => {
                      setSort({ field: "createdAt", dir: "desc" });
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${sort.field === "createdAt" && sort.dir === "desc" ? "bg-slate-100 font-bold" : "hover:bg-slate-50"}`}
                  >
                    Newest First
                  </button>
                  <button
                    onClick={() => {
                      setSort({ field: "createdAt", dir: "asc" });
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${sort.field === "createdAt" && sort.dir === "asc" ? "bg-slate-100 font-bold" : "hover:bg-slate-50"}`}
                  >
                    Oldest First
                  </button>
                  <button
                    onClick={() => {
                      setSort({ field: "title", dir: "asc" });
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${sort.field === "title" && sort.dir === "asc" ? "bg-slate-100 font-bold" : "hover:bg-slate-50"}`}
                  >
                    Name (A-Z)
                  </button>
                </div>
              )}
            </div>

            {(activeFilterCount > 0 ||
              search ||
              sort.field !== "createdAt" ||
              sort.dir !== "desc") && (
              <button
                onClick={resetFilters}
                className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <X size={14} /> Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Searching...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
            <AlertCircle size={20} /> Error: {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location Found</th>
                  <th className="px-6 py-4">Date Found</th>
                  <th className="px-6 py-4">Found By</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 overflow-hidden">
                        {(() => {
                          const hasRealImage =
                            item?.image &&
                            !item.image.startsWith("file://") &&
                            item.image.trim() !== "";
                          return hasRealImage ? (
                            <img
                              src={
                                item.image.startsWith("http") ||
                                item.image.startsWith("data:")
                                  ? item.image
                                  : `${BASE_URL}${item.image}`
                              }
                              alt="Item"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.classList.add(
                                  "flex",
                                  "items-center",
                                  "justify-center",
                                );
                                e.target.parentElement.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
                              }}
                            />
                          ) : (
                            <Box size={20} className="text-slate-400" />
                          );
                        })()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          ID: {item._id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.category || "General"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {item.location || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-700 font-medium">
                        {item.createdAt ? (
                          <>
                            <div>
                              {new Date(item.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {new Date(item.createdAt).toLocaleTimeString(
                                "en-US",
                                { hour: "numeric", minute: "2-digit" },
                              )}
                            </div>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UserCell
                        user={item.user}
                        contactInfo={item.contactInfo}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize
                        ${
                          item.status === "open"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : "bg-emerald-50 text-emerald-600 border-emerald-200"
                        }`}
                      >
                        {item.status === "open" ? "Unclaimed" : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No found items reported.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoundItems;
