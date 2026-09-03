import {
    AlertCircle,
    ArrowUpDown,
    Ban,
    Search,
    Shield,
    SlidersHorizontal,
    UserPlus,
    Users as UsersIcon,
    X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import API, { BASE_URL } from "../api";
import AddUserModal from "../components/AddUserModal";

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Search, Filter, Sort state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filters, setFilters] = useState({ role: "", status: "" });
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = `/admin/users?sortBy=${sort.field}&sortDir=${sort.dir}`;
      if (debouncedSearch) query += `&q=${encodeURIComponent(debouncedSearch)}`;
      if (filters.role) query += `&role=${encodeURIComponent(filters.role)}`;
      if (filters.status)
        query += `&status=${encodeURIComponent(filters.status)}`;

      const res = await API.get(query);
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, filters, sort]);

  const resetFilters = () => {
    setFilters({ role: "", status: "" });
    setSort({ field: "createdAt", dir: "desc" });
    setSearch("");
    setDebouncedSearch("");
  };

  const activeFilterCount = (filters.role ? 1 : 0) + (filters.status ? 1 : 0);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
      await API.patch(`/admin/users/${id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleToggleVerify = async (id, currentVerified) => {
    try {
      const newVerified = !currentVerified;
      await API.patch(`/admin/users/${id}/verify`, { isVerified: newVerified });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const totalUsers = users.length;
  const activeStaff = users.filter(
    (u) => u.role === "Admin" && (u.status === "Active" || !u.status),
  ).length;
  const suspended = users.filter((u) => u.status === "Suspended").length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Users</h1>
          <p className="text-slate-500">Manage student and staff accounts.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 cursor-pointer shadow-sm"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-slate-600">
              Total Users
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <UsersIcon size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3 mt-2">
            <div className="text-4xl font-bold text-slate-900">
              {totalUsers}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-slate-600">
              Active Staff
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Shield size={20} />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900 mt-2">
            {activeStaff}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-slate-600">
              Suspended
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <Ban size={20} />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900 mt-2">
            {suspended}
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
                placeholder="Search users..."
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
                      Role
                    </label>
                    <select
                      className="w-full border-slate-200 rounded-lg text-sm p-2"
                      value={filters.role}
                      onChange={(e) =>
                        setFilters({ ...filters, role: e.target.value })
                      }
                    >
                      <option value="">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Student">Student</option>
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
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
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
                      setSort({ field: "name", dir: "asc" });
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${sort.field === "name" && sort.dir === "asc" ? "bg-slate-100 font-bold" : "hover:bg-slate-50"}`}
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
          <div className="p-8 text-center text-slate-500">
            Searching users...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
            <AlertCircle size={20} /> Error: {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Items Reported</th>
                  <th className="px-6 py-4 text-center">Claims Made</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                          {(() => {
                            const rawAvatar = user.avatar || user.profileImage;
                            const hasRealImage =
                              rawAvatar &&
                              !rawAvatar.startsWith("file://") &&
                              rawAvatar !== "https://via.placeholder.com/150";
                            const initialFallback = `https://ui-avatars.com/api/?name=${user.name ? encodeURIComponent(user.name) : "U"}&background=6366f1&color=fff`;

                            return (
                              <img
                                src={
                                  hasRealImage
                                    ? rawAvatar.startsWith("http") ||
                                      rawAvatar.startsWith("data:")
                                      ? rawAvatar
                                      : `${BASE_URL}${rawAvatar}`
                                    : initialFallback
                                }
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = initialFallback;
                                }}
                                alt={user.name || "User"}
                                className="w-full h-full object-cover"
                              />
                            );
                          })()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {user.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">
                              {user.email}
                            </span>
                            {(() => {
                              const isVerified =
                                user.isVerified === true ||
                                user.role?.toLowerCase() === "admin" ||
                                user.authProvider === "google";

                              return (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleVerify(user._id, isVerified)
                                  }
                                  title="Click to toggle email verification status"
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                    isVerified
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  }`}
                                >
                                  {isVerified ? "✓ Verified" : "⚠ Unverified"}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
                        ${user.role === "Admin" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}
                      >
                        {user.role || "Student"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700">
                      {user.itemsReported || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700">
                      {user.claimsMade || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border
                        ${
                          user.status === "Active" || !user.status
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {user.status || "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleToggleStatus(user._id, user.status || "Active")
                        }
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-bold"
                      >
                        {user.status === "Active" || !user.status
                          ? "Suspend"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserCreated={() => fetchUsers()}
      />
    </div>
  );
};

export default Users;
