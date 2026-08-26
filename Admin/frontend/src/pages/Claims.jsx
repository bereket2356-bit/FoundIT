import {
    AlertCircle,
    Box,
    FileText,
    Info,
    MessageSquare,
    Search,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import API from "../api";

const Claims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [expandedClaimId, setExpandedClaimId] = useState(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await API.get("/claims");
      setClaims(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      if (status === "approved") await API.patch(`/claims/${id}/approve`);
      if (status === "rejected") await API.patch(`/claims/${id}/reject`);
      fetchClaims(); // refresh
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const filteredClaims =
    filter === "All"
      ? claims
      : claims.filter((c) => c.status === filter.toLowerCase());

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  if (loading && claims.length === 0)
    return (
      <div className="p-8 text-center text-slate-500">Loading claims...</div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
        <AlertCircle size={20} /> Error: {error}
      </div>
    );

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
              <div className="relative max-w-xs w-full sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search claims..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
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
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-slate-500"
                      >
                        No claims found.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim) => (
                      <React.Fragment key={claim._id}>
                        <tr
                          className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                          onClick={() =>
                            setExpandedClaimId(
                              expandedClaimId === claim._id ? null : claim._id,
                            )
                          }
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 overflow-hidden">
                              { claim.item?.image ? (
    <img src={claim.item.image.startsWith('file://') ? claim.item.image : `http://localhost:5000${claim.item.image}`} alt="Item" className="w-full h-full object-cover" />
) : (
    <Box size={20} />
) }
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-800">
                                {claim.item?.title || "Unknown"}
                              </div>
                              <div className="text-xs text-slate-500 font-mono mt-0.5">
                                ID: {claim.item?._id.slice(-6).toUpperCase()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${claim.claimant?.name?.replace(" ", "+") || "U"}&background=random`}
                                  alt="User"
                                />
                              </div>
                              <span className="text-sm text-slate-700">
                                {claim.claimant?.name || "Unknown"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-700">
                              {new Date(claim.createdAt).toLocaleDateString()}
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
                                      <strong className="text-slate-800 block mb-1">
                                        Claimant's Proof Photo:
                                      </strong>
                                      {claim.proof_image ? (
                                        <img
                                          src={claim.proof_image}
                                          alt="Proof"
                                          className="max-w-xs rounded border"
                                        />
                                      ) : (
                                        <p className="text-sm text-slate-500 italic">No photo provided</p>
                                      )}
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
                                      <strong className="text-slate-800 block mb-1">
                                        Found Item Photo:
                                      </strong>
                                      {claim.item?.image ? (
                                        <img
                                          src={claim.item.image.startsWith('file://') ? claim.item.image : `http://localhost:5000${claim.item.image}`}
                                          alt="Item"
                                          className="max-w-xs rounded border"
                                        />
                                      ) : (
                                        <p className="text-sm text-slate-500 italic">No photo provided</p>
                                      )}
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
