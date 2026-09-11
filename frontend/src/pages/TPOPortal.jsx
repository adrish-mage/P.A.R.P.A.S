import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function TPOPortal() {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");

  async function fetchInsights() {
    setError("");
    try {
      const result = await api.getPlacementInsights({});
      setInsights(result);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/portal/professional" className="back-link">← Back to account</Link>
        <h1>TPO Portal</h1>
        <p className="subtitle">Track student skills and placement readiness.</p>

        <div className="card">
          <h2>Student Skill Pool</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            Aggregate view is not built yet. It needs a students-by-institution index
            over SkillProfile, not exposed as an endpoint yet.
          </p>
        </div>

        <div className="card">
          <h2>Skill Gap Analysis · Placement Insights</h2>
          <p className="subtitle">Calls the Python intelligence layer (dummy fallback if it isn't running).</p>
          <button onClick={fetchInsights}>Fetch placement insights</button>
          {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
          {insights && (
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{JSON.stringify(insights, null, 2)}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
