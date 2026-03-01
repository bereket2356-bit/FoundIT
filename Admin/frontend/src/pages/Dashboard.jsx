// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "./Navbar";

const statColors = {
  totalLost: "#ef4444",
  totalFound: "#10b981",
  totalClaimed: "#3b82f6",
  totalPending: "#f59e0b",
  totalRejected: "#6b7280",
};

const statItems = [
  { key: "totalLost", label: "Lost Items", icon: "🔍" },
  { key: "totalFound", label: "Found Items", icon: "🟢" },
  { key: "totalClaimed", label: "Claimed", icon: "✅" },
  { key: "totalPending", label: "Pending Review", icon: "⏳" },
  { key: "totalRejected", label: "Rejected", icon: "❌" },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLost: 0,
    totalFound: 0,
    totalClaimed: 0,
    totalPending: 0,
    totalRejected: 0,
  });

  const [pendingClaims, setPendingClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch stats
      const statsRes = await API.get("/items/stats");
      setStats(statsRes.data);

      // Fetch pending claims
      const claimsRes = await API.get("/items?status=claimed-pending");
      setPendingClaims(claimsRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 45000); // refresh every ~45 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClaimAction = async (itemId, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus === "claimed" ? "accept" : "reject"} this claim?`)) {
      return;
    }

    try {
      await API.put(`/items/${itemId}`, { status: newStatus });
      fetchData(); // refresh everything
    } catch (err) {
      console.error("Claim action error:", err);
      alert("Failed to update claim status");
    }
  };

  return (
    <>
      <Navbar title="Admin Dashboard" />

      <div className="dashboard-page">
        <h1 className="page-title">Admin Overview</h1>

        {error && (
          <div className="error-message" style={{ marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading dashboard...</div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="stats-grid">
              {statItems.map(({ key, label, icon }) => (
                <div
                  key={key}
                  className="stat-card"
                  style={{ borderColor: statColors[key] || "#d1d5db" }}
                >
                  <div className="stat-icon">{icon}</div>
                  <div className="stat-value">{stats[key] ?? 0}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Pending Claims Section */}
            <section style={{ marginTop: "3rem" }}>
              <h2 className="section-title">
                Pending Claims ({pendingClaims.length})
              </h2>

              {pendingClaims.length === 0 ? (
                <div className="empty-state">
                  No pending claims at the moment.
                </div>
              ) : (
                <div className="items-grid">
                  {pendingClaims.map((item) => (
                    <div key={item._id} className="item-card">
                      <div className="item-header">
                        <h3>{item.title}</h3>
                        <span
                          className="status-badge"
                          style={{
                            background: "#dbeafe",
                            color: "#1e40af",
                          }}
                        >
                          Claim Pending
                        </span>
                      </div>

                      <p className="item-description">{item.description}</p>

                      <div className="item-meta">
                        <div>
                          Type: <strong>{item.type?.toUpperCase()}</strong>
                        </div>
                        <div>
                          Reported by:{" "}
                          <strong>
                            {item.createdBy?.name || item.createdBy?.email || "Unknown"}
                          </strong>
                        </div>
                        <div>
                          Claimed by:{" "}
                          <strong>
                            {item.claimedBy?.name ||
                              item.claimedBy?.email ||
                              "User"}
                          </strong>
                        </div>
                        {item.claimedAt && (
                          <div>
                            Claimed on:{" "}
                            {new Date(item.claimedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="item-actions">
                        <button
                          onClick={() => handleClaimAction(item._id, "claimed")}
                          className="btn btn-success"
                        >
                          Accept Claim
                        </button>
                        <button
                          onClick={() => handleClaimAction(item._id, "approved")}
                          className="btn btn-danger"
                        >
                          Reject Claim
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}