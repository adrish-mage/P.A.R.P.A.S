import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { getUserId } from "../session.js";

export default function FacultyPortal() {
  const userId = getUserId();
  const [inbox, setInbox] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const result = await api.getVerificationInbox(userId);
      setInbox(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function decide(entryType, entryId, action) {
    try {
      await api.decideVerification({
        anonymousRequestId: entryId,
        targetType: entryType === "SkillEvidence" ? "skill_evidence" : "project",
        action,
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="container">
        {!userId && (
          <div className="card">
            <h2>Faculty session not found</h2>
            <p className="subtitle">Sign in as the invited Faculty member to view anonymous requests.</p>
            <Link to="/auth" className="btn">Sign in</Link>
          </div>
        )}
        {userId && (
          <>
            <Link to="/portal/professional" className="back-link">← Back to account</Link>
            <h1>Faculty Portal</h1>
            <p className="subtitle">Review evidence without seeing the student identity.</p>
            {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
            {loading && <p className="subtitle">Loading…</p>}
            {!loading && (
              <div className="card">
                <h2>Anonymous verification requests</h2>
                {inbox.length === 0 && <p className="subtitle">Nothing pending.</p>}
                {inbox.map((entry) => (
                  <div className="list-item" key={entry._id}>
                    <div className="evidence-details">
                      <strong>{entry.targetType} evidence</strong>
                      <span className="subtitle">{entry.message || "No message provided"}</span>
                      {entry.target?.title && <span>{entry.target.title}</span>}
                      {entry.target?.description && <span>{entry.target.description}</span>}
                      <EvidenceLinks target={entry.target} />
                    </div>
                    <span>
                      <button onClick={() => decide(entry.targetType, entry.requestToken, "Endorsed")}>Endorse</button>
                      <button className="btn-secondary" onClick={() => decide(entry.targetType, entry.requestToken, "Rejected")}>Reject</button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

function EvidenceLinks({ target }) {
  if (!target) return null;
  const links = [
    target.repositoryUrl && { label: "Repository", url: target.repositoryUrl },
    target.liveUrl && { label: "Live project", url: target.liveUrl },
    ...(target.evidence || []).map((item) => ({ label: item.caption || `${item.type} evidence`, url: item.url })),
  ].filter(Boolean);

  if (links.length === 0) return <p className="review-empty">No evidence links attached.</p>;
  return (
    <div className="evidence-links">
      <strong>Evidence and references</strong>
      <div className="evidence-link-list">
        {links.map((link) => (
          <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
            <span>{link.label}</span>
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
