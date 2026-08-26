import { Bell, Search } from "lucide-react";

const Topbar = () => {
  return (
    <div className="h-16 border-b border-indigo-100 bg-white flex items-center justify-between px-8">
      {/* Brand & Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-600">FoundIT</span>
          <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-md">
            Admin Dashboard
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">
              Admin User
            </div>
            <div className="text-xs text-slate-500">Administrator</div>
          </div>
          <div className="w-8 h-8 bg-indigo-100 rounded-full border border-indigo-200 flex items-center justify-center overflow-hidden">
            <img
              src="https://ui-avatars.com/api/?name=Admin+User&background=6366f1&color=fff"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
