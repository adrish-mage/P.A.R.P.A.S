import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { clearSession, getUserId } from "../session.js";

export default function ProfessionalHome() {
  const navigate = useNavigate();
  const userId = getUserId();
  const [profile, setProfile] = useState(null);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        api.getProfessionalProfile(userId),
        api.listMembershipsForUser(userId),
      ]);
      setProfile(p);
      setInvites(m.filter((i) => i.status === "pending"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function respond(id, accept) {
    try {
      accept ? await api.acceptInvite(id) : await api.declineInvite(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p className="subtitle">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/auth" className="back-link" onClick={clearSession}>← Sign out</Link>
        <h1>Professional Account</h1>
        {error && <p style={{ color: "#e05c5c" }}>{error}</p>}

        <div className="card">
          <h2>Role status</h2>
          <p className={`status ${profile?.role === "Unassigned" ? "pending" : "verified"}`}>
            {profile?.role || "Unassigned"}
          </p>
          {profile?.role === "Unassigned" && (
            <p className="subtitle" style={{ marginBottom: 0 }}>
              No role, no dashboard access, no ability to endorse anything until
              an Institution or Organisation invites and you accept below.
            </p>
          )}
        </div>

        <div className="card">
          <h2>Pending invites</h2>
          {invites.length === 0 && <p className="subtitle" style={{ marginBottom: 0 }}>None right now.</p>}
          {invites.map((inv) => (
            <div className="list-item" key={inv._id}>
              <span>
                <strong>{inv.affiliationType} · {inv.affiliationId?.name || "Affiliation"}</strong>
                <br />
                <small>
                  Role: {inv.message?.match(/(?:Institution role:|Organisation role:)\s*(.+)$/i)?.[1] || "Member"} · Code: {inv.affiliationId?.code || "Not provided"} · Status: {inv.status}
                </small>
              </span>
              <span>
                <button onClick={() => respond(inv._id, true)}>Accept</button>{" "}
                <button className="btn-secondary" onClick={() => respond(inv._id, false)}>Decline</button>
              </span>
            </div>
          ))}
        </div>

        {profile?.role === "Faculty" && (
          <button onClick={() => navigate("/portal/faculty")}>Go to Faculty Portal</button>
        )}
        {profile?.role === "TPO" && (
          <button onClick={() => navigate("/portal/tpo")}>Go to TPO Portal</button>
        )}
        {profile?.role === "Employee" && (
          <button onClick={() => navigate("/recruiter")}>Go to Recruiter Portal</button>
        )}
      </div>
    </div>
  );
}
