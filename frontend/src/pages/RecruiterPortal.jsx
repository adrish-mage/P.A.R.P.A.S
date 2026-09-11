import { useState } from "react";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { api } from "../api.js";

export default function RecruiterPortal() {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listOrganisationCandidates().then(setCandidates).catch((err) => setError(err.message));
  }, []);

  const results = candidates.filter((candidate) =>
    `${candidate.name} ${candidate.email} ${candidate.bio || ""} ${(candidate.skills || []).map((skill) => skill.skillId?.name).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="page">
      <div className="container">
        <Link to="/" className="back-link">← Back</Link>
        <h1>Recruiter Portal</h1>
        <p className="subtitle">Discover registered PARPAS student profiles. Python ranking will be added later.</p>
        {error && <p style={{ color: "#e05c5c" }}>{error}</p>}

        <div className="card">
          <input
            type="text"
            placeholder="Search by skill, e.g. React"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="card">
          <h2>Results</h2>
          {results.length === 0 && <p className="subtitle" style={{ marginBottom: 0 }}>No matches.</p>}
          {results.map((c) => (
            <div className="list-item" key={c.userId}>
              <span>{c.name}<br /><small>{c.email}</small></span>
              <span className="subtitle" style={{ marginBottom: 0 }}>{(c.skills || []).map((skill) => skill.skillId?.name).filter(Boolean).join(", ") || "No mapped skills"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
