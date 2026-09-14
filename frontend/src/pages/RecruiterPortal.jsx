import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { getSessionValue } from "../session.js";

function evidenceFor(candidate) {
  return [
    { label: "Academics", records: candidate?.academicRecords || [] },
    { label: "Training", records: candidate?.training || [] },
    { label: "Application", records: candidate?.projects || [] },
    { label: "Industry exp.", records: candidate?.industryExperience || [] },
  ];
}

export default function RecruiterPortal() {
  const [params] = useSearchParams();
  const [candidates, setCandidates] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [candidateId, setCandidateId] = useState(params.get("candidateId") || "");
  const [opportunityId, setOpportunityId] = useState(params.get("opportunityId") || "");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [match, setMatch] = useState({ score: 0, skills: [] });
  const [showProfile, setShowProfile] = useState(false);
  const [proposal, setProposal] = useState("");
  const [proposalNotice, setProposalNotice] = useState("");
  const [proposalSending, setProposalSending] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const entityId = getSessionValue("entityId");
  const institutionQuery = params.get("institution")?.trim().toLowerCase() || "";

  useEffect(() => {
    async function load() {
      try {
        const [entries, allCandidates] = await Promise.all([api.listIndustryOpportunities(), api.listOrganisationCandidates()]);
        const ownedOpportunities = entries.filter((entry) => entry.organisationId?._id === entityId);
        setOpportunities(ownedOpportunities);
        setCandidates(allCandidates);
        setOpportunityId((current) => current || ownedOpportunities[0]?._id || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (entityId) load();
    else setLoading(false);
  }, [entityId]);

  useEffect(() => {
    if (!candidateId || !opportunityId) {
      setMatch({ score: 0, skills: [] });
      return;
    }
    let active = true;
    api.getCandidateOpportunityMatch(candidateId, opportunityId)
      .then((result) => { if (active) setMatch(result); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [candidateId, opportunityId]);

  const visibleCandidates = candidates.filter((item) => {
    if (!institutionQuery) return true;
    return `${item.institution?.name || ""} ${item.institution?.code || ""}`.toLowerCase().includes(institutionQuery);
  });
  const candidate = visibleCandidates.find((item) => String(item.studentId) === String(candidateId));
  const opportunity = opportunities.find((item) => String(item._id) === String(opportunityId)) || opportunities[0];
  const activeSkill = selectedSkill || match.skills[0]?.name || "No required skill";
  const activeSkillDetails = match.skills.find((skill) => skill.name === activeSkill);
  const evidence = evidenceFor(candidate);

  async function sendProposal() {
    if (!candidate || !opportunity || !proposal.trim()) return;
    setProposalSending(true);
    setProposalNotice("");
    try {
      await api.sendJobProposal(candidate.userId, opportunity._id, proposal);
      setProposalNotice("Job proposal sent to the candidate.");
      setProposal("");
    } catch (err) {
      setProposalNotice(err.message);
    } finally {
      setProposalSending(false);
    }
  }

  if (!entityId) return <div className="page"><div className="container"><h1>Organisation session not found</h1><Link to="/auth" className="btn">Sign in</Link></div></div>;
  if (loading) return <div className="analytics-page"><div className="analytics-shell"><p>Loading candidate analysis...</p></div></div>;
  if (error) return <div className="analytics-page"><div className="analytics-shell"><p>{error}</p><Link to="/portal/organisation">Back to organisation portal</Link></div></div>;

  return (
    <div className="analytics-page recruiter-view"><div className="analytics-shell">
      <header className="wire-header"><Link to="/portal/organisation" className="wire-back">← Organisation</Link><div><span className="wire-kicker">HR</span><strong>{opportunity?.organisationId?.name || "Organisation"}</strong></div><span className="wire-year">Candidate profile match</span></header>
      <section className="wire-toolbar recruiter-toolbar"><span className="toolbar-label">Select candidate</span><select value={candidate?.studentId || ""} onChange={(event) => { setCandidateId(event.target.value); setSelectedSkill(""); }}><option value="">Choose a candidate</option>{visibleCandidates.map((item) => <option value={item.studentId} key={item.studentId}>{item.name} · {item.institution?.name || "No institution"}</option>)}</select><span className="toolbar-label">Select role</span><select value={opportunity?._id || ""} onChange={(event) => { setOpportunityId(event.target.value); setSelectedSkill(""); }}>{opportunities.map((item) => <option value={item._id} key={item._id}>{item.title}</option>)}</select></section>
      {!candidate || !opportunity ? <div className="wire-empty-state"><strong>Select a candidate to view their analysis</strong><span>The wireframe will show their real skills, gaps, and evidence here.</span></div> : <>
        <section className="candidate-brief">
          <div><span className="brief-label">Candidate</span><h1>{candidate.name}</h1><p>{candidate.institution?.name || "Institution not linked"} · {candidate.careerInterest || "Career interest not provided"}</p></div>
          <div><span className="brief-label">Role under review</span><strong>{opportunity.title}</strong><small>{opportunity.type} · {opportunity.mode || "Mode not specified"}</small></div>
          <div className="brief-score"><span className="brief-label">Match</span><strong>{match.score}<small>%</small></strong><span>{match.score >= 80 ? "Strong fit" : match.score >= 50 ? "Promising fit" : "Needs review"}</span></div>
        </section>
        <section className="candidate-actions">
          <button type="button" onClick={() => setShowProfile((value) => !value)}>{showProfile ? "Hide profile" : "View profile"}</button>
          <button type="button" className="btn-secondary" onClick={() => document.getElementById("job-proposal")?.focus()}>Send job proposal</button>
        </section>
        {showProfile && <section className="candidate-profile-panel"><div className="candidate-profile-heading"><h2>{candidate.name}</h2><Link className="small-ghost" to={`/candidate/${candidate.studentId}`}>View full profile</Link></div><p>{candidate.bio || "Candidate profile summary not provided."}</p><p><strong>Career interest:</strong> {candidate.careerInterest || "Not provided"}</p><p><strong>Institution:</strong> {candidate.institution?.name || "Not linked"}</p><div className="profile-skill-links">{(candidate.skills || []).map((skill) => <span className="profile-skill-link" key={String(skill.skillId?._id || skill.skillId)}>{skill.skillId?.name || "Skill"} · {skill.score}/10</span>)}</div></section>}
        <section className="job-proposal-panel"><div><span className="brief-label">Direct outreach</span><h2>Send job proposal</h2><p>Invite this candidate to review the selected opportunity.</p></div><textarea id="job-proposal" value={proposal} onChange={(event) => setProposal(event.target.value)} placeholder="Write a short proposal message" rows={4} /><button type="button" onClick={sendProposal} disabled={proposalSending || !proposal.trim()}>{proposalSending ? "Sending..." : "Send proposal"}</button>{proposalNotice && <p className="proposal-notice">{proposalNotice}</p>}</section>
        <div className="match-layout"><aside className="match-score"><span>PARPAS match score</span><strong>{match.score}<small>%</small></strong><b>{match.score >= 80 ? "Strong" : match.score >= 50 ? "Promising" : "Needs review"}</b><h3>Candidate</h3><p>{candidate.name}</p><p>{candidate.institution?.name || "Institution not linked"}</p><p>{candidate.careerInterest || "Career interest not provided"}</p><h3>Evidence coverage</h3>{evidence.map((item) => <label key={item.label}>{item.label}<small>{item.records.length} record{item.records.length === 1 ? "" : "s"}</small></label>)}</aside>
          <main className="match-detail"><div className="wire-section-title"><div><h2>Skill-wise match information</h2><p>Compare each requirement with the candidate's current evidence</p></div><Link state={{ fromLabel: "Candidate Analysis" }} className="small-ghost" to={`/skill/${encodeURIComponent(activeSkill.toLowerCase())}?candidateId=${candidate.studentId}&opportunityId=${opportunity._id}`}>View active skill</Link></div>{match.skills.length === 0 && <p>No required skills configured for this opportunity.</p>}{match.skills.map((skill) => <div className="match-row-line" key={skill.name}><button className={`match-row ${activeSkill === skill.name ? "selected" : ""}`} onClick={() => setSelectedSkill(skill.name)}><strong>{skill.name}</strong><span>required <b>{skill.required || "any"}</b></span><i>│</i><span>candidate <b>{skill.candidate}</b></span><span>gap <b className={skill.gap >= 0 ? "positive" : "negative"}>{skill.gap > 0 ? "+" : ""}{skill.gap}</b></span><em>{skill.meets ? "✓" : skill.gap < -2 ? "!" : "≈"}</em></button><Link state={{ fromLabel: "Candidate Analysis" }} className="small-ghost match-skill-link" to={`/skill/${encodeURIComponent(skill.name.toLowerCase())}?candidateId=${candidate.studentId}&opportunityId=${opportunity._id}`}>View skill</Link></div>)}{activeSkillDetails && <p className="skill-analysis-note"><strong>{activeSkillDetails.name}</strong> · candidate level {activeSkillDetails.candidate} against required level {activeSkillDetails.required || "not specified"}.</p>}<div className="match-tags"><strong>Highlights</strong>{match.skills.filter((skill) => skill.meets).slice(0, 3).map((skill) => <span className="tag good" key={skill.name}>{skill.name}</span>)}<strong>Critical</strong>{match.skills.filter((skill) => !skill.meets).slice(0, 1).map((skill) => <span className="tag bad" key={skill.name}>{skill.name}</span>)}</div></main></div>
        <section className="evidence-section"><div className="evidence-section-heading"><div><span className="brief-label">Evidence trail</span><h2>{activeSkill} supporting records</h2></div><p>Evidence is shown by source so the match can be reviewed.</p></div><div className="evidence-strip">{evidence.map((item) => <div className="evidence-card" key={item.label}><strong>{item.label}</strong><small>{item.records.length} record{item.records.length === 1 ? "" : "s"}</small>{item.records.length ? item.records.slice(0, 3).map((record) => <span key={record._id || record.title || record.name}>{record.title || record.name || record.course?.name || record.role || "Record"}</span>) : <span>No records</span>}</div>)}</div></section>
      </>}
    </div></div>
  );
}
