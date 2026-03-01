// src/components/Navbar.jsx
import { useNavigate } from "react-router-dom";

export default function Navbar({ showBack = false, backTo = -1, title = "" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {showBack && (
          <button 
            onClick={() => navigate(backTo)} 
            className="btn-back"
            aria-label="Go back"
          >
            ← Back
          </button>
        )}
        {title && <h2 className="navbar-title">{title}</h2>}
      </div>

      <div className="navbar-right">
        <button 
          onClick={handleLogout}
          className="btn btn-danger btn-logout"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}