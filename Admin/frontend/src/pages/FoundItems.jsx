import { useState, useEffect } from 'react';
import API from '../api';
import { Filter, Box, AlertCircle } from 'lucide-react';

const FoundItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFoundItems = async () => {
      try {
        setLoading(true);
        const res = await API.get('/items?type=found');
        setItems(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFoundItems();
  }, []);

  if (loading && items.length === 0) return <div className="p-8 text-center text-slate-500">Loading found items...</div>;
  if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle size={20} /> Error: {error}</div>;

  const total = items.length;
  const unclaimed = items.filter(i => i.status === 'open').length;
  const returnRate = total === 0 ? 0 : Math.round(((total - unclaimed) / total) * 100);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Found Items</h1>
          <p className="text-slate-500">Items reported as found and awaiting claims.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
             <span className="text-lg leading-none">+</span> Report Found Item
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">TOTAL FOUND</div>
          <div className="text-3xl font-bold text-slate-800">{total}</div>
        </div>
        
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">UNCLAIMED</div>
          <div className="text-3xl font-bold text-slate-800 mb-2">{unclaimed}</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">RETURN RATE</div>
          <div className="text-3xl font-bold text-slate-800 mb-3">{returnRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
             <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${returnRate}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location Found</th>
                <th className="px-6 py-4">Date Found</th>
                <th className="px-6 py-4">Found By</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 overflow-hidden">
                        { item?.image ? (
    <img src={item.image.startsWith('file://') ? item.image : `http://localhost:5000${item.image}`} alt="Item" className="w-full h-full object-cover" />
) : (
    <Box size={24} />
) }
                     </div>
                     <div>
                       <div className="text-sm font-bold text-slate-800">{item.title}</div>
                       <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {item._id.slice(-6).toUpperCase()}</div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{item.category || 'General'}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{item.location || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-indigo-500">
                        {item.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm text-slate-700">{item.user?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border capitalize
                      ${item.status === 'open' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                        'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                      {item.status === 'open' ? 'Unclaimed' : item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No found items reported.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FoundItems;
