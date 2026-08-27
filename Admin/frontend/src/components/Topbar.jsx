import { Bell, FileText, Inbox, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const Topbar = () => {
  const [claims, setClaims] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchPendingClaims = async () => {
    try {
      const res = await API.get(
        "/claims?status=pending&sortBy=createdAt&sortDir=desc",
      );
      setClaims(res.data || []);
    } catch (err) {
      console.log("Error fetching admin notifications:", err);
    }
  };

  useEffect(() => {
    fetchPendingClaims();
    // Poll backend every 15 seconds for real-time notification updates
    const interval = setInterval(fetchPendingClaims, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = () => {
    setShowDropdown(false);
    navigate("/claims");
  };

  const unreadCount = claims.length;

  return (
    <div className="h-16 border-b border-indigo-100 bg-white flex items-center justify-between px-8 relative">
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
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-800">
                  New Claim Notifications
                </span>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} pending
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {claims.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
                    <Inbox size={28} />
                    <span className="text-xs">
                      No pending claim notifications
                    </span>
                  </div>
                ) : (
                  claims.map((claim) => (
                    <div
                      key={claim._id}
                      onClick={handleNotificationClick}
                      className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                        <FileText size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-800 leading-tight">
                          <strong className="font-semibold text-slate-900">
                            {claim.claimant?.name || "A student"}
                          </strong>{" "}
                          submitted a claim for{" "}
                          <span className="font-medium text-indigo-600">
                            {claim.item?.title || "an item"}
                          </span>
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(claim.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                onClick={handleNotificationClick}
                className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                View All Claims →
              </div>
            </div>
          )}
        </div>

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
