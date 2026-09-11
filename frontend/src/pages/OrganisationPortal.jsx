import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { clearSession, getSessionValue } from "../session.js";

const emptyForm = {
  title: "",
  description: "",
  type: "internship",
  location: "",
  mode: "remote",
  startDate: "",
  endDate: "",
  applicationDeadline: "",
  skills: "",
};

export default function OrganisationPortal() {
  const entityId = getSessionValue("entityId");
  const [form, setForm] = useState(emptyForm);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityId) load();
  }, [entityId]);

  async function load() {
    setLoading(true);
    try {
      const [entries, receivedApplications, allCandidates] = await Promise.all([
        api.listIndustryOpportunities(),
        api.listOrganisationApplications(),
        api.listOrganisationCandidates(),
      ]);
      setOpportunities(entries.filter((entry) => entry.organisationId?._id === entityId));
      setApplications(receivedApplications);
      setCandidates(allCandidates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createOpportunity(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const { skills, ...details } = form;
      const skillNames = skills.split(",").map((skill) => skill.trim()).filter(Boolean);
      const skillIds = await api.resolveSkillNames(skillNames);
      await api.createIndustryOpportunity({
        ...details,
        organisationId: entityId,
        requiredSkills: skillIds.map((skillId) => ({ skillId, required: true })),
      });
      setForm(emptyForm);
      setNotice("Internship published successfully.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateApplication(id, status) {
    setError("");
    try {
      await api.updateIndustryApplication(id, status, `Organisation marked application ${status.toLowerCase()}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!entityId) {
    return (
      <div className="page">
        <div className="container">
          <h1>Organisation session not found</h1>
          <Link to="/auth" className="btn">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/auth" className="back-link" onClick={clearSession}>← Sign out</Link>
        <h1>Organisation Portal</h1>
        <p className="subtitle">Create internships and connect them to the skills you need.</p>
        {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
        {notice && <p className="subtitle">{notice}</p>}

        <div className="card">
          <h2>Create opportunity</h2>
          <form onSubmit={createOpportunity}>
            <input name="title" value={form.title} onChange={updateField} placeholder="Internship title" required />
            <textarea name="description" value={form.description} onChange={updateField} placeholder="Describe the work, expectations, and learning outcomes" rows="5" required />
            <select name="type" value={form.type} onChange={updateField}>
              <option value="internship">Internship</option>
              <option value="job">Job</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="live_project">Live project</option>
              <option value="challenge">Challenge</option>
            </select>
            <input name="location" value={form.location} onChange={updateField} placeholder="Location" />
            <select name="mode" value={form.mode} onChange={updateField}>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <label>Start date<input name="startDate" type="date" value={form.startDate} onChange={updateField} /></label>
            <label>End date<input name="endDate" type="date" value={form.endDate} onChange={updateField} /></label>
            <label>Application deadline<input name="applicationDeadline" type="date" value={form.applicationDeadline} onChange={updateField} /></label>
            <input name="skills" value={form.skills} onChange={updateField} placeholder="Required skills, comma separated: React, Node.js, MongoDB" />
            <button type="submit">Publish opportunity</button>
          </form>
        </div>

        <div className="card">
          <h2>PARPAS candidates</h2>
          <p className="subtitle">Search registered students by name, email, bio, or mapped skill. Python ranking can be added later.</p>
          <input value={candidateQuery} onChange={(event) => setCandidateQuery(event.target.value.toLowerCase())} placeholder="Search candidates or skills" />
          {candidates.filter((candidate) => `${candidate.name} ${candidate.email} ${candidate.bio || ""} ${(candidate.skills || []).map((skill) => skill.skillId?.name).join(" ")}`.toLowerCase().includes(candidateQuery)).map((candidate) => (
            <div className="list-item" key={candidate.userId}>
              <span>
                <strong>{candidate.name}</strong>
                <br />
                <small>{candidate.email} · {(candidate.skills || []).map((skill) => skill.skillId?.name).filter(Boolean).join(", ") || "No mapped skills"}</small>
              </span>
              <span className="status verified">Candidate</span>
            </div>
          ))}
          {candidates.filter((candidate) => `${candidate.name} ${candidate.email} ${candidate.bio || ""} ${(candidate.skills || []).map((skill) => skill.skillId?.name).join(" ")}`.toLowerCase().includes(candidateQuery)).length === 0 && <p className="subtitle">No candidates found.</p>}
        </div>

        <div className="card">
          <h2>Your opportunities</h2>
          {loading && <p className="subtitle">Loading...</p>}
          {!loading && opportunities.length === 0 && <p className="subtitle">No opportunities published yet.</p>}
          {opportunities.map((entry) => (
            <div className="list-item" key={entry._id}>
              <span>
                <strong>{entry.title}</strong>
                <br />
                <small>{entry.type} · {entry.mode || "Mode not set"} · {(entry.requiredSkills || []).map((skill) => skill.skillId?.name).filter(Boolean).join(", ") || "No skills mapped"}</small>
              </span>
              <span className="status verified">Active</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Candidate applications</h2>
          <p className="subtitle">Review applications and make decisions. Skill ranking can be added later by the Python service.</p>
          {applications.length === 0 && <p className="subtitle">No candidate applications yet.</p>}
          {applications.map((application) => (
            <div className="list-item" key={application._id}>
              <span>
                <strong>{application.studentId?.name || "Student"}</strong>
                <br />
                <small>{application.studentId?.email || "No email"} · {application.industryOpportunityId?.title || "Opportunity"}</small>
                {application.coverNote && <small style={{ display: "block", marginTop: 4 }}>{application.coverNote}</small>}
              </span>
              <span>
                <span className={`status ${application.status === "Accepted" ? "verified" : "pending"}`}>{application.status}</span>
                {!["Accepted", "Rejected", "Withdrawn"].includes(application.status) && (
                  <span style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => updateApplication(application._id, "Accepted")}>Accept</button>
                    <button className="btn-secondary" onClick={() => updateApplication(application._id, "Rejected")}>Reject</button>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
