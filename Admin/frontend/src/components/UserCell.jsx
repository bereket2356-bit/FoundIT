
const UserCell = ({ user, contactInfo }) => {
  const name = user?.name || "Unknown User";
  const email = user?.email || "No email available";
  const avatar = user?.avatar || user?.profileImage;
  const hasRealAvatar =
    avatar &&
    !avatar.startsWith("file://") &&
    avatar !== "https://via.placeholder.com/150";
  const initialFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
        <img
          src={
            hasRealAvatar
              ? avatar.startsWith("http") || avatar.startsWith("data:")
                ? avatar
                : `http://localhost:5000${avatar}`
              : initialFallback
          }
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = initialFallback;
          }}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-slate-800 truncate">
          {name}
        </span>
        <span className="text-xs text-slate-500 font-mono truncate">
          {email}
        </span>
        {contactInfo ? (
          <span className="text-[11px] text-indigo-600 font-mono mt-0.5 truncate">
            {contactInfo}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default UserCell;
