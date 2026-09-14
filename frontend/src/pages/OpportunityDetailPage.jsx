import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { getUserId } from "../session.js";

function formatDate(value) {
  if (!value) return "Not specified";
  return new Date(value).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function OpportunityDetailPage() {
  const { opportunityId } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [studentSkills, setStudentSkills] = useState([]);
  const [coverNote, setCoverNote] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userId = getUserId();
    Promise.all([api.getIndustryOpportunity(opportunityId), api.listMyIndustryApplications(), userId ? api.getSkillProfile(userId) : Promise.resolve({ skills: [] })])
      .then(([listing, mine, skillProfile]) => {
        setOpportunity(listing);
        setApplications(mine);
        setStudentSkills(skillProfile.skills || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [opportunityId]);

  const existingApplication = applications.find((item) => String(item.industryOpportunityId?._id || item.industryOpportunityId) === String(opportunityId));
  const scoreBySkill = new Map(studentSkills.map((skill) => [String(skill.skillId?._id || skill.skillId), Number(skill.score) || 0]));
  const unmetSkills = (opportunity?.requiredSkills || []).filter((required) => required.required !== false && (scoreBySkill.get(String(required.skillId?._id || required.skillId)) || 0) < (required.minScore || 10));
  const canApply = unmetSkills.length === 0;

  async function apply(event) {
    event.preventDefault();
    setSubmitting(true);
    setNotice("");
    setError("");
    if (!canApply) return;
    try {
      const application = await api.applyToIndustryOpportunity(opportunityId, coverNote);
      setApplications((current) => [application, ...current]);
      setNotice("Application submitted successfully.");
      setCoverNote("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page"><div className="container"><p>Loading opportunity...</p></div></div>;
  if (error && !opportunity) return <div className="page"><div className="container"><p className="form-error">{error}</p><Link to="/portal/student" className="btn">Back to student portal</Link></div></div>;

  return (
    <div className="page opportunity-detail-page">
      <div className="container">
        <Link to="/portal/student" className="back-link">← Back to opportunities</Link>
        <section className="opportunity-detail-header">
          <span className="eyebrow">{opportunity.type === "job" ? "Full-time role" : opportunity.type}</span>
          <h1>{opportunity.title}</h1>
          <p className="opportunity-detail-organisation">{opportunity.organisationId?.name || "Organisation"}</p>
          <div className="opportunity-detail-tags"><span>{opportunity.location || "Location not specified"}</span><span>{opportunity.mode || "Mode not specified"}</span><span>Apply by {formatDate(opportunity.applicationDeadline)}</span></div>
        </section>
        <section className="opportunity-detail-grid">
          <article className="card opportunity-detail-content">
            <h2>Role details</h2>
            <p>{opportunity.description || "No description provided."}</p>
            <h2>Required skills</h2>
            <div className="matched-skill-list">{(opportunity.requiredSkills || []).map((skill) => { const score = scoreBySkill.get(String(skill.skillId?._id || skill.skillId)) || 0; return <span key={String(skill.skillId?._id || skill.skillId)}>{skill.skillId?.name || "Required skill"} · your score {score}/10 · minimum {skill.minScore || 10}/10</span>; })}</div>
            <div className="opportunity-dates"><span><strong>Start date</strong>{formatDate(opportunity.startDate)}</span><span><strong>End date</strong>{formatDate(opportunity.endDate)}</span></div>
          </article>
          <aside className="card opportunity-apply-card">
            <h2>{existingApplication ? "Application status" : "Apply for this opportunity"}</h2>
            {existingApplication ? <><p className="status verified">{existingApplication.status}</p><p>Your application has already been submitted for this opportunity.</p></> : !canApply ? <><p className="form-error">You cannot apply yet. Your skill scores must meet every required minimum.</p><p>Improve: {unmetSkills.map((skill) => skill.skillId?.name || "Required skill").join(", ")}</p><button type="button" disabled>Minimum score not met</button></> : <form onSubmit={apply}><textarea value={coverNote} onChange={(event) => setCoverNote(event.target.value)} placeholder="Why are you a strong fit for this role?" rows={7} required /><button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit application"}</button></form>}
            {notice && <p className="demo-notice">{notice}</p>}
            {error && <p className="form-error">{error}</p>}
          </aside>
        </section>
      </div>
    </div>
  );
}
