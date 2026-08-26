import { useState, useEffect } from 'react';
import API from '../api';
import { Box, ClipboardCheck, ShieldCheck, Clock, XCircle, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, isNegative }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <div className={`p-2 rounded-full ${color}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</div>
  </div>
);

const Overview = () => {
  const [stats, setStats] = useState({ lost: 0, found: 0, claimed: 0, pending: 0, rejected: 0 });
  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch stats
        const statsRes = await API.get('/admin/stats');
        setStats(statsRes.data);

        // Fetch recent claims (just picking all and filtering pending, or you could do it server-side)
        const claimsRes = await API.get('/claims');
        const pending = claimsRes.data.filter(c => c.status === 'pending').slice(0, 5); // top 5
        setPendingClaims(pending);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading overview...</div>;
  if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle size={20} /> Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Overview</h1>
        <p className="text-slate-500">Monitor lost and found activity across campus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Lost Items" value={stats.lost} icon={Box} color="bg-indigo-50 text-indigo-500" />
        <StatCard title="Found Items" value={stats.found} icon={ClipboardCheck} color="bg-emerald-50 text-emerald-500" />
        <StatCard title="Claimed" value={stats.claimed} icon={ShieldCheck} color="bg-amber-50 text-amber-600" />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="bg-yellow-50 text-yellow-600" isNegative={true} />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-50 text-red-500" isNegative={true} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">Pending Claims</h2>
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.pending}</span>
          </div>
          <button className="text-indigo-600 text-sm font-medium hover:text-indigo-700">View All</button>
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
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No pending claims</td>
                </tr>
              ) : pendingClaims.map((claim) => (
                <tr key={claim._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 overflow-hidden">
                        { claim.item?.image ? (
    <img src={claim.item.image.startsWith('file://') ? claim.item.image : `http://localhost:5000${claim.item.image}`} alt="Item" className="w-full h-full object-cover" />
) : (
    <Box size={20} />
) }
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{claim.item?.title || "Unknown Item"}</div>
                        <div className="text-xs text-slate-500">ID: {claim.item?._id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                        <img src={`https://ui-avatars.com/api/?name=${claim.claimant?.name?.replace(' ', '+') || 'User'}&background=random`} alt={claim.claimant?.name || "User"} />
                      </div>
                      <span className="text-sm text-slate-700">{claim.claimant?.name || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{new Date(claim.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200/50">
                      <Clock size={12} />
                      Pending
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
