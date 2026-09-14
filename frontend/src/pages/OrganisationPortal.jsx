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
  const [institutions, setInstitutions] = useState([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [searchMode, setSearchMode] = useState("opportunity");
  const [institutionQuery, setInstitutionQuery] = useState("");
  const [institutionSearch, setInstitutionSearch] = useState("");
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
      const [entries, receivedApplications, allCandidates, verifiedInstitutions] = await Promise.all([
        api.listIndustryOpportunities(),
        api.listOrganisationApplications(),
        api.listOrganisationCandidates(),
        api.listVerifiedInstitutions(),
      ]);
      setOpportunities(entries.filter((entry) => entry.organisationId?._id === entityId));
      setApplications(receivedApplications);
      setCandidates(allCandidates);
      setInstitutions(verifiedInstitutions);
      if (!selectedOpportunityId) {
        setSelectedOpportunityId(entries.find((entry) => entry.organisationId?._id === entityId)?._id || "");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getCandidateMatch(candidate, opportunity) {
    if (!opportunity || !Array.isArray(opportunity.requiredSkills) || !candidate?.skills?.length) {
      return { score: 0, matchCount: 0, requiredCount: 0, matchedSkills: [] };
    }

    const skillMap = new Map(
      candidate.skills
        .filter((entry) => entry?.skillId?._id || entry?.skillId)
        .map((entry) => [String(entry.skillId?._id || entry.skillId), entry])
    );

    const analysedSkills = opportunity.requiredSkills
      .map((requiredSkill) => {
        const skillId = String(requiredSkill.skillId?._id || requiredSkill.skillId);
        const studentSkill = skillMap.get(skillId);
        const requiredScore = Number(requiredSkill.minScore || 0);
        if (!studentSkill) return { name: requiredSkill.skillId?.name || "Skill", currentScore: 0, requiredScore, gap: -requiredScore, meetsRequirement: false, weight: Number(requiredSkill.weight || 1) };
        const currentScore = Number(studentSkill.score || 0);
        return { name: requiredSkill.skillId?.name || "Skill", currentScore, requiredScore, gap: currentScore - requiredScore, meetsRequirement: currentScore >= requiredScore, weight: Number(requiredSkill.weight || 1) };
      });

    const requiredCount = opportunity.requiredSkills.length;
    const matchCount = analysedSkills.filter((skill) => skill.meetsRequirement).length;
   const totalWeight = analysedSkills.reduce((total, skill) => total + skill.weight, 0);
   const score = requiredCount === 0 ? 0 : Math.min(100, Math.round(analysedSkills.reduce((total, skill) => total + Math.min(1, skill.requiredScore ? skill.currentScore / skill.requiredScore : 1) * skill.weight, 0) / totalWeight * 100));

    return { score, matchCount, requiredCount, matchedSkills: analysedSkills };
  }

  async function shortlistCandidate(candidate) {
    if (!selectedOpportunityId) {
      setError("Select an opportunity before shortlisting a candidate.");
      return;
    }

    try {
      setError("");
      await api.shortlistCandidate({ organisationId: entityId, opportunityId: selectedOpportunityId, studentId: candidate.studentId });
      setNotice(`${candidate.name} shortlisted for the selected opportunity.`);
    } catch (err) {
      setError(err.message);
    }
  }

  function candidateEvidence(candidate) {
    return [
      ...(candidate.academicRecords || []).map((record) => ({
        label: record.course?.name || "Academic record",
        detail: [record.course?.type, record.performance?.grade || (record.performance?.marks != null ? `${record.performance.marks}/${record.performance.maxMarks}` : "")].filter(Boolean).join(" · "),
      })),
      ...(candidate.training || []).map((record) => ({ label: record.name, detail: `${record.provider?.externalProviderName || "Training"}${record.certificate?.assessmentScore != null ? ` · Assessment ${record.certificate.assessmentScore}%` : ""}` })),
      ...(candidate.projects || []).map((project) => ({ label: project.title, detail: project.type || "Project" })),
      ...(candidate.industryExperience || []).map((experience) => ({ label: experience.role || "Industry experience", detail: `${experience.organisationId?.name || "Organisation"}${experience.type ? ` · ${experience.type}` : ""}` })),
    ];
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
          <p className="subtitle">Find students by institution and job fit, or search the complete recruiter-visible student pool.</p>
          <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className={searchMode === "opportunity" ? "" : "btn-secondary"} onClick={() => setSearchMode("opportunity")}>Match by institution and job</button>
              <button type="button" className={searchMode === "general" ? "" : "btn-secondary"} onClick={() => setSearchMode("general")}>Search all students</button>
            </div>
            {searchMode === "opportunity" && <>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={institutionSearch} onChange={(event) => setInstitutionSearch(event.target.value)} placeholder="Enter institution name" />
                <button type="button" onClick={() => setInstitutionQuery(institutionSearch.trim())}>Search institution</button>
              </div>
              {institutionSearch.trim() && (
                <div className="institution-suggestions">
                  {institutions
                    .filter((institution) => `${institution.name} ${institution.code}`.toLowerCase().includes(institutionSearch.trim().toLowerCase()))
                    .slice(0, 5)
                    .map((institution) => (
                      <button type="button" key={institution._id} onClick={() => { setInstitutionSearch(institution.name); setInstitutionQuery(institution.name); }}>
                        <strong>{institution.name}</strong><small>{institution.code}</small>
                      </button>
                    ))}
                </div>
              )}
              <select value={selectedOpportunityId} onChange={(event) => setSelectedOpportunityId(event.target.value)}>
                <option value="">Select job or opportunity to assess fit</option>
                {opportunities.map((opportunity) => (
                  <option key={opportunity._id} value={opportunity._id}>{opportunity.title}</option>
                ))}
              </select>
            </>}
            {searchMode === "general" && <input value={candidateQuery} onChange={(event) => setCandidateQuery(event.target.value.toLowerCase())} placeholder="Search candidates or skills" />}
          </div>

          {(() => {
            const selectedOpportunity = opportunities.find((opportunity) => opportunity._id === selectedOpportunityId);
            if (searchMode === "opportunity") {
              if (!institutionQuery) return <p className="subtitle">Search for an institution to view its students in the wireframe.</p>;
              const institutionCandidates = candidates.filter((candidate) => `${candidate.institution?.name || ""} ${candidate.institution?.code || ""}`.toLowerCase().includes(institutionQuery.toLowerCase()));
              const institutionName = institutionCandidates[0]?.institution?.name || institutionQuery;
              return (
                <div className="institution-search-result">
                  <span>
                    <strong>{institutionName}</strong>
                    <small>{institutionCandidates.length} student{institutionCandidates.length === 1 ? "" : "s"} available for this institution</small>
                  </span>
                  {institutionCandidates.length > 0 && selectedOpportunity ? <Link className="btn" to={`/recruiter?institution=${encodeURIComponent(institutionQuery)}&opportunityId=${selectedOpportunity._id}`}>View students</Link> : <small>{selectedOpportunity ? "No students found for this institution." : "Select a job to continue."}</small>}
                </div>
              );
            }
            const filteredCandidates = candidates.filter((candidate) => {
              const haystack = `${candidate.name || ""} ${candidate.email || ""} ${candidate.bio || ""} ${candidate.careerInterest || ""} ${(candidate.skills || []).map((skill) => skill.skillId?.name).join(" ")}`.toLowerCase();
              const institution = `${candidate.institution?.name || ""} ${candidate.institution?.code || ""}`.toLowerCase();
              const institutionMatches = searchMode === "general" || !institutionQuery.trim() || institution.includes(institutionQuery.trim().toLowerCase());
              return institutionMatches && haystack.includes(candidateQuery);
            });

            if (filteredCandidates.length === 0) {
              return <p className="subtitle">No candidates found.</p>;
            }

            return filteredCandidates.map((candidate) => {
              const match = getCandidateMatch(candidate, selectedOpportunity);
              const skillNames = (candidate.skills || []).map((skill) => skill.skillId?.name).filter(Boolean);
              const isSelected = selectedCandidateId === String(candidate.studentId);
              const evidence = candidateEvidence(candidate);

              return (
                <div className="list-item" key={candidate.studentId || candidate.userId} style={{ alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ display: "grid", gap: 4, flex: 1 }}>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.email}</small>
                    <small><strong>Institution:</strong> {candidate.institution?.name || "Institution not linked"}</small>
                    {candidate.careerInterest && <small>{candidate.careerInterest}</small>}
                    <small>{skillNames.length ? skillNames.join(", ") : "No mapped skills"}</small>
                    {isSelected && (
                      <span style={{ display: "grid", gap: 6, marginTop: 8 }}>
                        <small>{candidate.bio || "No bio provided."}</small>
                        <small><strong>Evidence:</strong> {evidence.length ? evidence.map((item) => `${item.label}${item.detail ? ` (${item.detail})` : ""}`).join(" · ") : "No academic, training, project, or industry records yet."}</small>
                        {match.matchedSkills.length > 0 && <small><strong>Matched requirements:</strong> {match.matchedSkills.map((skill) => `${skill.name} ${skill.currentScore}/${skill.requiredScore || "any"}`).join(" · ")}</small>}
                      </span>
                    )}
                  </span>

                  <span style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    {searchMode === "opportunity" && selectedOpportunity ? (
                      <span className="status verified" style={{ minWidth: 110, textAlign: "center" }}>
                        {match.score}% fit
                      </span>
                    ) : (
                      <span className="status pending">Student</span>
                    )}

                    <span style={{ display: "flex", gap: 8 }}>
                      <button className="btn-secondary" type="button" onClick={() => setSelectedCandidateId(isSelected ? "" : String(candidate.studentId))}>
                        {isSelected ? "Hide analysis" : "View profile"}
                      </button>
                    {searchMode === "opportunity" && selectedOpportunity && (
                      <span style={{ display: "flex", gap: 8 }}>
                        <Link className="small-ghost" to={`/recruiter?candidateId=${candidate.studentId}&opportunityId=${selectedOpportunity._id}`}>View skill analysis</Link>
                        <button type="button" onClick={() => shortlistCandidate(candidate)}>Shortlist</button>
                      </span>
                    )}
                    </span>
                  </span>
                </div>
              );
            });
          })()}
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
