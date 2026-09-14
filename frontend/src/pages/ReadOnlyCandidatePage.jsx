import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { getSessionValue } from "../session.js";

function recordsFor(candidate) {
  return [
    { title: "Academic records", items: candidate.academicRecords || [], empty: "No academic records" },
    { title: "Training and certifications", items: candidate.training || [], empty: "No training records" },
    { title: "Projects", items: candidate.projects || [], empty: "No projects" },
    { title: "Industry experience", items: candidate.industryExperience || [], empty: "No industry experience" },
  ];
}

function recordLabel(record) {
  return record.title || record.name || record.course?.name || record.companyName || record.role || "Evidence record";
}

export default function ReadOnlyCandidatePage() {
  const { studentId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const entityId = getSessionValue("entityId");

  useEffect(() => {
    if (!entityId) {
      setError("Organisation session not found");
      setLoading(false);
      return;
    }
    api.listOrganisationCandidates()
      .then((candidates) => {
        const match = candidates.find((item) => String(item.studentId) === String(studentId));
        if (!match) throw new Error("Candidate profile not found");
        setCandidate(match);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [entityId, studentId]);

  if (loading) return <div className="analytics-page"><div className="analytics-shell"><p>Loading candidate profile...</p></div></div>;
  if (error) return <div className="analytics-page"><div className="analytics-shell"><p>{error}</p><Link to="/recruiter" className="small-ghost">Back to candidate analysis</Link></div></div>;

  return (
    <div className="analytics-page readonly-candidate-page">
      <div className="analytics-shell">
        <header className="wire-header">
          <Link to="/recruiter" className="wire-back">← Candidate analysis</Link>
          <div><span className="wire-kicker">Read-only profile</span><strong>{candidate.name}</strong></div>
          <span className="wire-year">Recruiter view</span>
        </header>
        <section className="readonly-candidate-header">
          <div>
            <span className="brief-label">Candidate profile</span>
            <h1>{candidate.name}</h1>
            <p>{candidate.bio || "No profile summary provided."}</p>
          </div>
          <div className="readonly-candidate-meta">
            <span><strong>Institution</strong>{candidate.institution?.name || "Not linked"}</span>
            <span><strong>Career interest</strong>{candidate.careerInterest || "Not provided"}</span>
            <span><strong>Visibility</strong>{candidate.profileVisibility || "Recruiter"}</span>
          </div>
        </section>
        <section className="readonly-section">
          <div className="wire-section-title"><div><h2>Skills</h2><p>Current proficiency from the candidate profile</p></div></div>
          <div className="readonly-skill-list">{(candidate.skills || []).length ? candidate.skills.map((skill) => <span className="profile-skill-link" key={String(skill.skillId?._id || skill.skillId)}>{skill.skillId?.name || "Skill"} · {skill.score}/10</span>) : <p>No skills recorded</p>}</div>
        </section>
        <section className="readonly-record-grid">
          {recordsFor(candidate).map((group) => <div className="readonly-record-section" key={group.title}><h2>{group.title}</h2>{group.items.length ? group.items.map((record) => <div className="readonly-record" key={record._id || recordLabel(record)}><strong>{recordLabel(record)}</strong><span>{record.description || record.course?.type || record.type || record.companyName || "Recorded profile evidence"}</span></div>) : <p>{group.empty}</p>}</div>)}
        </section>
      </div>
    </div>
  );
}
