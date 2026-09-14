import { useEffect, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { getUserId } from "../session.js";

const details = {
  python: {
    name: "Python",
    domain: "Programming and data systems",
    stage: "Developing",
    updated: "August 29, 2026",
    demand: "High",
    internships: 5,
    popularity: "Mid",
    roles: ["Backend Engineer", "Data Analyst", "ML Associate"],
    related: ["SQL", "FastAPI", "Data Analysis", "Docker", "Git"],
  },
  react: {
    name: "React",
    domain: "Frontend engineering",
    stage: "Proficient",
    updated: "August 26, 2026",
    demand: "High",
    internships: 8,
    popularity: "High",
    roles: ["Frontend Engineer", "Full Stack Engineer", "Product Engineer"],
    related: ["JavaScript", "Node.js", "TypeScript", "Testing", "CSS"],
  },
};

export default function SkillDetailPage() {
  const location = useLocation();
  const { skillName = "python" } = useParams();
  const [params] = useSearchParams();
  const [candidate, setCandidate] = useState(null);
  const normalizedName = skillName.toLowerCase();
  const skill = details[normalizedName] || {
    name: skillName.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    domain: "Verified capability",
    stage: "Developing",
    updated: "Recently added",
    demand: "To assess",
    internships: 0,
    popularity: "Emerging",
    roles: ["Relevant role matching pending"],
    related: [],
  };
  useEffect(() => {
    const candidateId = params.get("candidateId");
    if (candidateId) {
      api.listOrganisationCandidates().then((candidates) => {
        setCandidate(candidates.find((item) => String(item.studentId) === candidateId) || null);
      }).catch(() => setCandidate(null));
      return;
    }

    const userId = getUserId();
    if (!userId) return;
    Promise.all([
      api.getCurrentUser(userId),
      api.getStudentProfile(userId),
      api.getSkillProfile(userId),
      api.listAcademicRecords(userId),
      api.listTraining(userId),
      api.listProjects(userId),
      api.listIndustryExperience(userId),
    ]).then(async ([user, profile, skillProfile, academicRecords, training, projects, industryExperience]) => {
      const institution = profile.institutionLink?.institutionId
        ? await api.getInstitution(profile.institutionLink.institutionId).catch(() => null)
        : null;
      setCandidate({
        name: user.name,
        bio: profile.bio,
        careerInterest: profile.careerInterest,
        profileVisibility: profile.profileVisibility,
        institution,
        skills: skillProfile.skills || [],
        academicRecords,
        training,
        projects,
        industryExperience,
      });
    }).catch(() => setCandidate(null));
  }, [params]);

  const candidateSkill = candidate?.skills?.find((entry) => entry.skillId?.name?.toLowerCase() === normalizedName);
  const candidateSkillId = candidateSkill && String(candidateSkill.skillId?._id || candidateSkill.skillId);
  const candidateEvidence = candidate ? [
    { label: "Academics", records: candidate.academicRecords || [] },
    { label: "Training", records: candidate.training || [] },
    { label: "Application", records: candidate.projects || [] },
    { label: "Industry validation", records: candidate.industryExperience || [] },
  ] : [];
  const evidenceForSkill = candidateEvidence.map((group) => ({
    ...group,
    records: group.records.filter((record) => {
      const mappedSkills = record.skills || record.skillIds || [];
      return mappedSkills.length === 0 || mappedSkills.some((entry) => {
        const mappedSkillId = String(entry.skillId?._id || entry.skillId);
        const mappedSkillName = entry.skillId?.canonicalName || entry.skillId?.name || entry.name;
        return mappedSkillId === candidateSkillId || mappedSkillName?.toLowerCase() === normalizedName;
      });
    }),
  }));
  const displayStage = candidateSkill ? (candidateSkill.score >= 8 ? "Proficient" : candidateSkill.score >= 6 ? "Developing" : "Early") : skill.stage;
  return (
    <div className="skill-detail-page">
      <div className="skill-detail-shell">
        <h1>Detailed view of a <span>single</span> skill</h1>
        <section className="detail-frame">
          <header className="detail-heading"><div><h2>{skill.name}</h2><p>{candidate ? `${candidate.name} · ${candidate.institution?.name || "Institution not linked"}` : skill.domain}</p></div><div><span>Stage</span><strong>{displayStage}</strong><span>Candidate score</span><b>{candidateSkill ? `${candidateSkill.score}/10` : "Not selected"}</b></div></header>
          <div className="evidence-tabs">{(candidate ? evidenceForSkill : ["Academics", "Training", "Application", "Industry validation"].map((label) => ({ label, records: [] }))).map((item) => <div className="evidence-tab" key={item.label}><strong>{item.label}</strong><span className={item.records.length ? "complete" : "pending-ring"}>{item.records.length ? "✓" : "◌"}</span><small>{item.records.length ? `${item.records.length} record${item.records.length === 1 ? "" : "s"}` : candidate ? "No linked evidence" : "General skill view"}</small></div>)}</div>
          <div className="detail-columns"><div className="audit-area"><p className="detail-hint">{candidate ? "Candidate-specific skill evidence" : "General skill information"}</p><h3>{candidate ? `${candidate.name}'s evidence` : "Skill development"}</h3>{candidate ? evidenceForSkill.flatMap((group) => group.records.slice(0, 5).map((record) => <div className="audit-row" key={`${group.label}-${record._id || record.title || record.name}`}><time>{group.label}</time><span>{record.title || record.name || record.course?.name || record.role || "Evidence record"}</span><b>{group.label}</b></div>)) : ["Course completed, certificate added, project submitted for verification.", "Project verified and skill evidence updated."].map((text, index) => <div className="audit-row" key={text}><time>{index ? "June 2, 2026" : "August 29, 2026"}</time><span>{text}</span><b>Triggered by<br />user / org</b></div>)}{candidate && !evidenceForSkill.some((group) => group.records.length) && <p className="future-copy">No records are mapped directly to this skill yet.</p>}<h3 className="future-title">Suggested future developments</h3><p className="future-copy">Build more verified evidence across projects, training, and industry applications to move this skill to the next stage.</p><div className="related-skills"><span>Related skills</span>{skill.related.map((item) => <button key={item}>{item}</button>)}</div></div><aside className="relevance-area"><h3>Relevance at a glance</h3><strong>{skill.demand}</strong><span>industry demand</span><strong>{skill.internships}</strong><span>internships need this skill</span><strong>{skill.popularity}</strong><span>relative skill popularity</span><h3>Relevant industrial roles</h3>{skill.roles.map((role) => <button key={role}>{role}</button>)}</aside></div>
        </section>
      </div>
    </div>
  );
}
