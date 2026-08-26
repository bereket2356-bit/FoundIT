import { useState, useEffect } from 'react';
import API from '../api';
import { Building, Settings as SettingsIcon, CloudDownload, ChevronDown, AlertCircle } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    orgName: "",
    adminEmail: "",
    campusLocation: "Main Campus - North",
    autoArchive: true,
    publicPortal: false,
    retentionPeriod: "60 Days"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await API.get('/admin/settings');
        if (res.data) setSettings(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await API.patch('/admin/settings', settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle size={20} /> Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-500">Manage system preferences and admin controls.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
             Cancel
           </button>
           <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
             {saving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 text-indigo-600 rounded-lg text-sm font-medium shadow-sm">
               <SettingsIcon size={18} className="text-indigo-600" />
               General
            </a>
            {/* Other tabs omitted for brevity but remain structurally identical */}
          </nav>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
               <Building size={20} className="text-indigo-600" />
               <h2 className="text-lg font-bold text-slate-800">Organization Details</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">Basic information about your institution or campus.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-2">Organization Name</label>
                 <input type="text" name="orgName" value={settings.orgName} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-700 mb-2">Admin Contact Email</label>
                 <input type="email" name="adminEmail" value={settings.adminEmail} onChange={handleChange} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            
            <div>
               <label className="block text-xs font-semibold text-slate-700 mb-2">Campus Location</label>
               <div className="relative">
                 <select name="campusLocation" value={settings.campusLocation} onChange={handleChange} className="appearance-none w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                   <option>Main Campus - North</option>
                   <option>Main Campus - South</option>
                   <option>Downtown Campus</option>
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
               <SettingsIcon size={20} className="text-indigo-600" />
               <h2 className="text-lg font-bold text-slate-800">System Preferences</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">Configure how FoundIT operates and displays data.</p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">Auto-Archive Resolved Claims</div>
                  <div className="text-sm text-slate-500">Automatically move claims to the archive 30 days after they are marked as resolved.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="autoArchive" checked={settings.autoArchive} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">Public Claim Submission Portal</div>
                  <div className="text-sm text-slate-500">Allow students to submit lost item claims without logging in.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="publicPortal" checked={settings.publicPortal} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">Default Retention Period</div>
                  <div className="text-sm text-slate-500">Time before unclaimed low-value items are donated.</div>
                </div>
                <div className="relative w-32 flex-shrink-0">
                   <select name="retentionPeriod" value={settings.retentionPeriod} onChange={handleChange} className="appearance-none w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                     <option>30 Days</option>
                     <option>60 Days</option>
                     <option>90 Days</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
