import {
    AlertCircle,
    Box,
    ClipboardCheck,
    Clock,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";
import UserCell from "../components/UserCell";

const StatCard = ({ title, value, icon: Icon, color, isNegative }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className={`p-2 rounded-full ${color}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
      {title}
    </div>
  </div>
);

const Overview = () => {
  const [stats, setStats] = useState({
    lost: 0,
    found: 0,
    claimed: 0,
    pending: 0,
    rejected: 0,
  });
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await API.get("/admin/stats");
        setStats(statsRes.data);

        // Fetch recent pending claims
        const claimsRes = await API.get(
          "/claims?status=pending&sortBy=createdAt&sortDir=desc",
        );
        setPendingClaims(claimsRes.data.slice(0, 5)); // top 5
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">Loading overview...</div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
        <AlertCircle size={20} /> Error: {error}
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Admin Overview
        </h1>
        <p className="text-slate-500">
          Monitor lost and found activity across campus.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Lost Items"
          value={stats.lost}
          icon={Box}
          color="bg-indigo-50 text-indigo-500"
        />
        <StatCard
          title="Found Items"
          value={stats.found}
          icon={ClipboardCheck}
          color="bg-emerald-50 text-emerald-500"
        />
        <StatCard
          title="Claimed"
          value={stats.claimed}
          icon={ShieldCheck}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
          isNegative={true}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          color="bg-red-50 text-red-500"
          isNegative={true}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              Recent Pending Claims
            </h2>
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.pending}
            </span>
          </div>
          <Link
            to="/claims"
            className="text-indigo-600 text-sm font-medium hover:text-indigo-700"
          >
            View All
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Claimant</th>
                <th className="px-6 py-4">Date Requested</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingClaims.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No pending claims
                  </td>
                </tr>
              ) : (
                pendingClaims.map((claim) => (
                  <tr
                    key={claim._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
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
                                    : `http://localhost:5000${img}`
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
                            {claim.item?.title || "Unknown Item"}
                          </div>
                          <div className="text-xs text-slate-500">
                            ID:{" "}
                            {claim.item?._id?.slice(-6).toUpperCase() || "N/A"}
                          </div>
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
                              {new Date(claim.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {new Date(claim.createdAt).toLocaleTimeString(
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200/50">
                        <Clock size={12} />
                        Pending
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
