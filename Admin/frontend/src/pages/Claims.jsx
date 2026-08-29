import {
    AlertCircle,
    ArrowUpDown,
    Box,
    ExternalLink,
    FileText,
    ImageOff,
    Info,
    MessageSquare,
    Search,
} from "lucide-react";
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

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [sort, setSort] = useState({ field: "createdAt", dir: "desc" });
  const [showSort, setShowSort] = useState(false);

  const [expandedClaimId, setExpandedClaimId] = useState(null);

  const debouncedSearchHandler = useCallback(
    debounce((query) => setDebouncedSearch(query), 500),
    [],
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    debouncedSearchHandler(e.target.value);
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      let query = `/claims?sortBy=${sort.field}&sortDir=${sort.dir}`;
      if (filter !== "All") query += `&status=${filter.toLowerCase()}`;
      if (debouncedSearch) query += `&q=${encodeURIComponent(debouncedSearch)}`;

      const res = await API.get(query);
      setClaims(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [filter, debouncedSearch, sort]);

  const handleStatusChange = async (id, status) => {
    try {
      if (status === "approved") await API.patch(`/claims/${id}/approve`);
      if (status === "rejected") await API.patch(`/claims/${id}/reject`);
      fetchClaims(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Claims</h1>
          <p className="text-slate-500">
            Review and manage claim requests submitted by students.
          </p>
        </div>

        <div className="flex bg-white rounded-full border border-slate-200 p-1 shadow-sm text-sm">
          {["All", "Pending", "Approved", "Rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-1.5 font-medium rounded-full ${filter === f ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 xl:w-3/4 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">
                Recent Requests
              </h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search claims..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
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
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl p-2 z-10">
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
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-500">
                  Searching claims...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
                  <AlertCircle size={20} /> Error: {error}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4">Claimant</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Message</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {claims.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          No claims found.
                        </td>
                      </tr>
                    ) : (
                      claims.map((claim) => (
                        <React.Fragment key={claim._id}>
                          <tr
                            className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                            onClick={() =>
                              setExpandedClaimId(
                                expandedClaimId === claim._id
                                  ? null
                                  : claim._id,
                              )
                            }
                          >
                            <td className="px-6 py-4 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 overflow-hidden">
                                {(() => {
                                  const img = claim.item?.image;
                                  const hasRealImage =
                                    img &&
                                    !img.startsWith("file://") &&
                                    img.trim() !== "";
                                  return hasRealImage ? (
                                    <img
                                      src={
                                        img.startsWith("http") ||
                                        img.startsWith("data:")
                                          ? img
                                          : `${BASE_URL}${img}`
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
                                <div className="text-sm font-medium text-slate-800">
                                  {claim.item?.title || "Unknown"}
                                </div>
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                  ID:{" "}
                                  {claim.item?._id?.slice(-6).toUpperCase() ||
                                    "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <UserCell
                                user={claim.claimant}
                                contactInfo={claim.contact_info}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-slate-700 font-medium">
                                {claim.createdAt ? (
                                  <>
                                    <div>
                                      {new Date(
                                        claim.createdAt,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-mono">
                                      {new Date(
                                        claim.createdAt,
                                      ).toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize
                              ${
                                claim.status === "pending"
                                  ? "bg-amber-50 text-amber-600 border-amber-200"
                                  : claim.status === "approved"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-red-50 text-red-600 border-red-200"
                              }`}
                              >
                                {claim.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {claim.proof_description || claim.message ? (
                                <MessageSquare size={18} />
                              ) : (
                                <FileText size={18} />
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {claim.status === "pending" && (
                                <div
                                  className="flex gap-2 justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() =>
                                      handleStatusChange(claim._id, "approved")
                                    }
                                    className="text-emerald-600 hover:text-emerald-700 text-sm font-bold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusChange(claim._id, "rejected")
                                    }
                                    className="text-red-600 hover:text-red-700 text-sm font-bold"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                          {expandedClaimId === claim._id && (
                            <tr className="bg-slate-50">
                              <td
                                colSpan="6"
                                className="px-6 py-4 border-t border-slate-100"
                              >
                                <div className="flex gap-8">
                                  <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">
                                      Claimant's Lost Details
                                    </h4>
                                    <div className="space-y-2 text-sm text-slate-600">
                                      <p>
                                        <strong className="text-slate-800">
                                          Proof:
                                        </strong>{" "}
                                        {claim.proof_description ||
                                          claim.message ||
                                          "N/A"}
                                      </p>
                                      <p>
                                        <strong className="text-slate-800">
                                          Location Lost:
                                        </strong>{" "}
                                        {claim.lost_location || "Not provided"}
                                      </p>
                                      <p>
                                        <strong className="text-slate-800">
                                          Date/Time Lost:
                                        </strong>{" "}
                                        {claim.lost_date
                                          ? new Date(
                                              claim.lost_date,
                                            ).toLocaleString()
                                          : "Not provided"}
                                      </p>
                                      <p>
                                        <strong className="text-slate-800">
                                          Contact:
                                        </strong>{" "}
                                        {claim.contact_info || "Not provided"}
                                      </p>
                                      <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <strong className="text-slate-800 text-xs uppercase tracking-wider">
                                            Claimant's Proof Photo:
                                          </strong>
                                        </div>
                                        {(() => {
                                          const img = claim.proof_image;
                                          const hasRealProof =
                                            img &&
                                            !img.startsWith("file://") &&
                                            img.trim() !== "";
                                          const proofSrc = hasRealProof
                                            ? img.startsWith("http") ||
                                              img.startsWith("data:")
                                              ? img
                                              : `${BASE_URL}${img}`
                                            : null;

                                          return proofSrc ? (
                                            <div className="relative group overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-slate-50">
                                              <img
                                                src={proofSrc}
                                                alt="Claimant Proof"
                                                className="w-full h-52 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                                onClick={() =>
                                                  window.open(
                                                    proofSrc,
                                                    "_blank",
                                                  )
                                                }
                                              />
                                              <div
                                                onClick={() =>
                                                  window.open(
                                                    proofSrc,
                                                    "_blank",
                                                  )
                                                }
                                                className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[11px] px-2 py-1 rounded flex items-center gap-1 cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
                                              >
                                                <ExternalLink size={12} /> View
                                                Full
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="h-44 w-full bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
                                              <ImageOff size={24} />
                                              <span className="text-xs font-medium">
                                                No photo provided
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200">
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">
                                      Finder's Found Details
                                    </h4>
                                    <div className="space-y-2 text-sm text-slate-600">
                                      <p>
                                        <strong className="text-slate-800">
                                          Description:
                                        </strong>{" "}
                                        {claim.item?.description || "N/A"}
                                      </p>
                                      <p>
                                        <strong className="text-slate-800">
                                          Location Found:
                                        </strong>{" "}
                                        {claim.item?.location || "N/A"}
                                      </p>
                                      <p>
                                        <strong className="text-slate-800">
                                          Date Found:
                                        </strong>{" "}
                                        {claim.item?.date
                                          ? new Date(
                                              claim.item.date,
                                            ).toLocaleDateString()
                                          : "N/A"}
                                      </p>
                                      <div className="mt-4">
                                        <div className="flex items-center justify-between mb-2">
                                          <strong className="text-slate-800 text-xs uppercase tracking-wider">
                                            Found Item Photo:
                                          </strong>
                                        </div>
                                        {(() => {
                                          const img = claim.item?.image;
                                          const hasRealItem =
                                            img &&
                                            !img.startsWith("file://") &&
                                            img.trim() !== "";
                                          const itemSrc = hasRealItem
                                            ? img.startsWith("http") ||
                                              img.startsWith("data:")
                                              ? img
                                              : `${BASE_URL}${img}`
                                            : null;

                                          return itemSrc ? (
                                            <div className="relative group overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-slate-50">
                                              <img
                                                src={itemSrc}
                                                alt="Found Item"
                                                className="w-full h-52 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                                onClick={() =>
                                                  window.open(itemSrc, "_blank")
                                                }
                                              />
                                              <div
                                                onClick={() =>
                                                  window.open(itemSrc, "_blank")
                                                }
                                                className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[11px] px-2 py-1 rounded flex items-center gap-1 cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
                                              >
                                                <ExternalLink size={12} /> View
                                                Full
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="h-44 w-full bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
                                              <Box size={24} />
                                              <span className="text-xs font-medium">
                                                No photo provided
                                              </span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 xl:w-1/4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="text-sm font-semibold text-slate-800 mb-2">
              Pending Claims
            </div>
            <div className="flex items-end gap-3">
              <div className="text-4xl font-bold text-slate-900">
                {pendingCount}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-indigo-600">
                <Info size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Claim Policy</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Ensure all claimants provide valid student ID and detailed
              description matching the found item log before approving.
            </p>
            <button className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1">
              View Full Guidelines{" "}
              <span className="text-lg leading-none">&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Claims;
