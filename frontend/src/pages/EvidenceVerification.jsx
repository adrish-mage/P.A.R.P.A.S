import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { getUserId } from "../session.js";

export default function EvidenceVerification() {
  const userId = getUserId();
  const [projects, setProjects] = useState([]);
  const [training, setTraining] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [audits, setAudits] = useState({});
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
      const [p, t, studentProfile] = await Promise.all([
        api.listProjects(userId),
        api.listTraining(userId),
        api.getStudentProfile(userId),
      ]);
      setProjects(p);
      setTraining(t);
      const projectAudits = await Promise.all(p.map((project) => api.getVerificationAuditTrail("Project", project._id)));
      setAudits(Object.fromEntries(p.map((project, index) => [project._id, projectAudits[index]])));

      const institutionId = studentProfile?.institutionLink?.institutionId;
      if (institutionId && studentProfile.institutionLink.status === "Linked") {
        const linkedFaculty = await api.listLinkedProfessionals(institutionId, "Faculty");
        setFaculty(Array.isArray(linkedFaculty) ? linkedFaculty : [linkedFaculty].filter(Boolean));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function requestVerifier(entryType, entryId, requestedVerifierId) {
    if (!requestedVerifierId) return;
    try {
      await api.requestVerification({ entryType, entryId, studentId: userId, verifierUserId: requestedVerifierId });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function EntryRow({ entry, entryType }) {
    const auditItems = audits[entry._id] || [];
    const hasVerifiedAudit = auditItems.some((item) => item.status === "verified");
    const pendingFacultyRequest = auditItems.some((item) => item.status === "pending" || item.status === "processing");
    return (
      <div className="list-item" key={entry._id}>
        <span>{entry.title}</span>
        <span className={`status ${hasVerifiedAudit ? "verified" : "pending"}`}>
          {auditItems.length ? auditItems.map((item) => `${item.status} by ${item.verifierUserId?.name || "verifier"}`).join(" · ") : "Self-submitted"}
        </span>
        {!hasVerifiedAudit && !pendingFacultyRequest && faculty.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => requestVerifier(entryType, entry._id, e.target.value)}
          >
            <option value="" disabled>
              {entry.requestedVerifierId ? "Verifier requested, awaiting decision" : "Request verifier..."}
            </option>
            {faculty.map((f) => (
              <option key={f._id} value={f.userId._id}>{f.userId.name}</option>
            ))}
          </select>
        )}
        {pendingFacultyRequest && !hasVerifiedAudit && <span className="status pending">Verification requested</span>}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {!userId && (
          <div className="card">
            <h2>Student session not found</h2>
            <p className="subtitle">Sign in as the Student who owns this evidence.</p>
            <Link to="/auth" className="btn">Sign in</Link>
          </div>
        )}
        {userId && (
          <>
        <Link to="/portal/student" className="back-link">← Back to portal</Link>
        <h1>Evidence & Verification</h1>
        <p className="subtitle">
          Every claim starts Self-Submitted. Request a Faculty member already
          linked to your Institution to endorse it. That upgrades the status
          and writes an immutable audit record.
        </p>

        {faculty.length === 0 && (
          <div className="card" style={{ borderColor: "#5c4ee0" }}>
            <p className="subtitle" style={{ marginBottom: 0 }}>
              No linked Faculty found yet. You need a Linked Institution with at
              least one accepted Faculty invite before you can request verification.
            </p>
          </div>
        )}

        {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
        {loading && <p className="subtitle">Loading…</p>}

        {!loading && (
          <>
            <div className="card">
              <h2>Projects</h2>
              {projects.length === 0 && <p className="subtitle" style={{ marginBottom: 0 }}>None submitted yet.</p>}
              {projects.map((p) => <EntryRow key={p._id} entry={p} entryType="Project" />)}
            </div>

            <div className="card">
              <h2>Training</h2>
              {training.length === 0 && <p className="subtitle" style={{ marginBottom: 0 }}>None submitted yet.</p>}
              {training.map((t) => <EntryRow key={t._id} entry={t} entryType="Training" />)}
            </div>
          </>
        )}
          </>
        )}
      </div>
    </div>
  );
}
