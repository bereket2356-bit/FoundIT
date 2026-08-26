import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Overview from './pages/Overview';
import LostItems from './pages/LostItems';
import FoundItems from './pages/FoundItems';
import Claims from './pages/Claims';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

// Auth Guard
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Check for valid session and admin role
  if (!token || role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Root Redirect Component
const RootRedirect = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/login" replace />; // or an error route
  
  return <Navigate to="/overview" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<RootRedirect />} />
          <Route path="overview" element={<Overview />} />
          <Route path="lost-items" element={<LostItems />} />
          <Route path="found-items" element={<FoundItems />} />
          <Route path="claims" element={<Claims />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
