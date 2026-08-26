import { useState, useEffect } from 'react';
import API from '../api';
import { Search, UserPlus, Users as UsersIcon, Shield, Ban, AlertCircle } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
      await API.patch(`/admin/users/${id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const totalUsers = users.length;
  const activeStaff = users.filter(u => u.role === 'Admin' && u.status === 'Active').length;
  const suspended = users.filter(u => u.status === 'Suspended').length;

  if (loading && users.length === 0) return <div className="p-8 text-center text-slate-500">Loading users...</div>;
  if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle size={20} /> Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Users</h1>
          <p className="text-slate-500">Manage student and staff accounts.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
           <div className="relative flex-1 sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               placeholder="Search users..." 
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
             />
           </div>
           <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0">
             <UserPlus size={16} />
             Add User
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-slate-600">Total Users</div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
               <UsersIcon size={20} />
            </div>
          </div>
          <div className="flex items-end gap-3 mt-2">
             <div className="text-4xl font-bold text-slate-900">{totalUsers}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-slate-600">Active Staff</div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
               <Shield size={20} />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900 mt-2">{activeStaff}</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div className="text-sm font-semibold text-slate-600">Suspended</div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
               <Ban size={20} />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-900 mt-2">{suspended}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
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
                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                         <img src={`https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=random`} alt={user.name} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium
                      ${user.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role || 'Student'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-slate-700">{user.itemsReported}</td>
                  <td className="px-6 py-4 text-center text-sm text-slate-700">{user.claimsMade}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border
                      ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                        'bg-red-50 text-red-600 border-red-200'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button onClick={() => handleToggleStatus(user._id, user.status || 'Active')} className="text-indigo-600 hover:text-indigo-700 text-sm font-bold">
                        {user.status === 'Active' ? 'Suspend' : 'Activate'}
                     </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
