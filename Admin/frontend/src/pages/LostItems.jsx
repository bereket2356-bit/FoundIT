import { useState, useEffect } from 'react';
import API from '../api';
import { Search, ChevronDown, Calendar, MapPin, Box, AlertCircle } from 'lucide-react';

const LostItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLostItems = async () => {
      try {
        setLoading(true);
        const res = await API.get('/items?type=lost');
        setItems(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLostItems();
  }, []);

  if (loading && items.length === 0) return <div className="p-8 text-center text-slate-500">Loading lost items...</div>;
  if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle size={20} /> Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Lost Items</h1>
        <p className="text-slate-500">All items reported as lost by students.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>
          
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Report Lost Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Location & Date</th>
                <th className="px-6 py-4">Reported By</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                     <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                        { item?.image ? (
    <img src={item.image.startsWith('file://') ? item.image : `http://localhost:5000${item.image}`} alt="Item" className="w-full h-full object-cover" />
) : (
    <Box size={24} />
) }
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-slate-800">{item.title}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {item._id.slice(-6).toUpperCase()}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.category || 'General'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 mb-1">
                      <MapPin size={14} className="text-slate-400" />
                      {item.location || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=${item.user?.name?.replace(' ', '+') || 'U'}&background=random`} alt={item.user?.name || "User"} />
                      </div>
                      <span className="text-sm text-slate-700">{item.user?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize
                      ${item.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                        item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                        'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No lost items reported.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LostItems;
