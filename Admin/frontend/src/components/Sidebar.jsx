import {
    BarChart2,
    Box,
    ClipboardCheck,
    FileText,
    LayoutGrid,
    LogOut,
    MapPin,
    Settings,
    Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const navItems = [
    { name: "Overview", path: "/overview", icon: LayoutGrid },
    { name: "Lost Items", path: "/lost-items", icon: Box },
    { name: "Found Items", path: "/found-items", icon: ClipboardCheck },
    { name: "Claims", path: "/claims", icon: FileText },
    { name: "Users", path: "/users", icon: Users },
    { name: "Reports", path: "/reports", icon: BarChart2 },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-indigo-50/30 border-r border-indigo-100 flex flex-col justify-between py-6 px-4">
      <div>
        {/* Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-2 shadow-lg">
            <MapPin size={28} fill="currentColor" className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1">
            FoundIT
          </h2>
          <span className="text-xs text-slate-500">Inventory Management</span>
        </div>

        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 font-medium mb-8 transition-colors">
          <span className="text-lg leading-none">+</span> New Entry
        </button>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-indigo-100" : "text-slate-400"}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 border-t border-indigo-100 pt-4">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors">
          <LogOut size={18} className="text-slate-400" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
