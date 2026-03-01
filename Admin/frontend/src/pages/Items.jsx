import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "./Navbar";

export default function Items() {
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const itemsRes = await API.get("/items");
      const claimsRes = await API.get("/claims");

      setItems(itemsRes.data);
      setClaims(claimsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approveClaim = async (id) => {
    await API.patch(`/claims/${id}/approve`);
    fetchData();
  };

  const rejectClaim = async (id) => {
    await API.patch(`/claims/${id}/reject`);
    fetchData();
  };

  // 📊 COUNTS
  const totalLost = items.filter(i => i.type === "lost").length;
  const totalFound = items.filter(i => i.type === "found").length;
  const totalClaimed = items.filter(i => i.status === "claimed").length;
  const totalRejected = items.filter(i => i.status === "rejected").length;
  const totalPendingReports = items.filter(i => i.status === "pending").length;
  const totalPendingClaims = claims.filter(c => c.status === "pending").length;
  const totalApprovedClaims = claims.filter(c => c.status === "approved").length;

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Navbar title="Admin Dashboard" showBack={true} backTo="/" />

      <div style={{ padding: "30px" }}>

        {/* 📊 STATISTICS */}
        <h2>System Overview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "30px" }}>
          <StatBox label="Lost Items" value={totalLost} />
          <StatBox label="Found Items" value={totalFound} />
          <StatBox label="Pending Reports" value={totalPendingReports} />
          <StatBox label="Pending Claims" value={totalPendingClaims} />
          <StatBox label="Approved Claims" value={totalApprovedClaims} />
          <StatBox label="Claimed Items" value={totalClaimed} />
          <StatBox label="Rejected Items" value={totalRejected} />
        </div>

        {/* 📨 CLAIM REQUESTS */}
        <h2>Claim Requests</h2>

        {claims.length === 0 ? (
          <p>No claims yet</p>
        ) : (
          claims.map((claim) => (
            <div key={claim._id} style={cardStyle}>
              <h3>{claim.item?.title}</h3>
              <p><strong>Type:</strong> {claim.item?.type}</p>
              <p><strong>Claimed By:</strong> {claim.claimant?.name}</p>
              <p><strong>Message:</strong> {claim.message}</p>
              <p><strong>Status:</strong> {claim.status}</p>

              {claim.status === "pending" && (
                <>
                  <button onClick={() => approveClaim(claim._id)} style={approveBtn}>
                    Approve
                  </button>
                  <button onClick={() => rejectClaim(claim._id)} style={rejectBtn}>
                    Reject
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{
      padding: "20px",
      borderRadius: "10px",
      background: "#f3f4f6",
      textAlign: "center",
      fontWeight: "bold"
    }}>
      <div style={{ fontSize: "22px" }}>{value}</div>
      <div>{label}</div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "15px"
};

const approveBtn = {
  marginRight: "10px",
  padding: "8px 15px",
  backgroundColor: "green",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

const rejectBtn = {
  padding: "8px 15px",
  backgroundColor: "red",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};