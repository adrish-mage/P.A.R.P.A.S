import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { clearSession, getUserId } from "../session.js";
import SingletonPanel from "../components/SingletonPanel.jsx";
import ListPanel from "../components/ListPanel.jsx";

export default function StudentPortal() {
  const userId = getUserId();
  const [backendStatus, setBackendStatus] = useState("checking");
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [autoLoadedDemo, setAutoLoadedDemo] = useState(false);

  useEffect(() => {
    api
      .health()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    if (!userId || backendStatus !== "online" || autoLoadedDemo) return;

    let cancelled = false;

    api.getCurrentUser(userId)
      .then((user) => {
        if (cancelled || !user || !/aarav\s+sen/i.test(user.name || "")) return;
        return api.loadStudentDemoData();
      })
      .then((result) => {
        if (!result || cancelled) return;
        setProfileRefreshKey((value) => value + 1);
        setAutoLoadedDemo(true);
      })
      .catch(() => {
        setAutoLoadedDemo(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, backendStatus, autoLoadedDemo]);

  if (!userId) {
    return (
      <div className="page">
        <div className="container">
          <h1>Not signed in</h1>
          <p className="subtitle">Sign in via DigiLocker to get a userId first.</p>
          <Link to="/auth" className="btn">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/auth" className="back-link" onClick={clearSession}>← Sign out</Link>
        <h1>Student Portal</h1>
        <StudentOverview key={profileRefreshKey} userId={userId} />
        <p className="subtitle">
          Backend:{" "}
          <span className={`status ${backendStatus === "online" ? "verified" : "pending"}`}>
            {backendStatus === "checking" ? "checking…" : backendStatus}
          </span>{" "}
          · userId: {userId}
        </p>

        {backendStatus === "offline" && (
          <div className="card" style={{ borderColor: "#e05c5c" }}>
            <h2>Backend unreachable</h2>
            <p className="subtitle" style={{ marginBottom: 0 }}>
              Start mern-core (`npm run dev` in the backend folder) with a MongoDB
              connection string in `.env`. This page won't load data until it's up.
            </p>
          </div>
        )}

        <StudentProfileGate userId={userId} />

        <InstitutionRequestSection userId={userId} />

        <IndustryOpportunitySection key={`opportunities-${profileRefreshKey}`} userId={userId} />

        <div id="skill-profile"><SkillProfileSection key={profileRefreshKey} userId={userId} /></div>

        <div id="academic-records"><ListPanel key={`academic-${profileRefreshKey}`}
          sectionId="academic-records"
          title="Academic Records"
          description="College courses, NPTEL, external courses"
          userId={userId}
          onList={api.listAcademicRecords}
          onCreate={api.createAcademicRecord}
          onDelete={api.deleteAcademicRecord}
          fields={[
            { name: "type", label: "Type", type: "select", options: ["CollegeCourse", "NPTEL", "ExternalCourse"], required: true },
            { name: "title", label: "Course title", required: true },
            { name: "institution", label: "Institution" },
            { name: "grade", label: "Grade" },
            { name: "completionDate", label: "Completion date", type: "date" },
          ]}
          renderItem={(e) => (
            <span>
              {e.title} <span className="subtitle">· {e.type}{e.grade ? ` · ${e.grade}` : ""}</span>{" "}
              <span className={`status ${e.verificationStatus === "SelfSubmitted" ? "pending" : "verified"}`}>
                {e.verificationStatus}
              </span>
            </span>
          )}
        /></div>

        <div id="certificates"><ListPanel key={`certificates-${profileRefreshKey}`}
          sectionId="certificates"
          title="Certifications & Training"
          description="Certifications, workshops, bootcamps, hands-on training"
          userId={userId}
          onList={api.listTraining}
          onCreate={api.createTraining}
          onDelete={api.deleteTraining}
          fields={[
            { name: "type", label: "Type", type: "select", options: ["Certification", "Workshop", "Bootcamp", "HandsOnTraining"], required: true },
            { name: "title", label: "Title", required: true },
            { name: "organizer", label: "Organizer" },
            { name: "duration", label: "Duration" },
            { name: "completionDate", label: "Completion date", type: "date" },
          ]}
          renderItem={(e) => (
            <span>
              {e.title} <span className="subtitle">· {e.type}</span>{" "}
              <span className={`status ${e.verificationStatus === "SelfSubmitted" ? "pending" : "verified"}`}>
                {e.verificationStatus}
              </span>
            </span>
          )}
        /></div>

        <div id="projects"><ListPanel key={`projects-${profileRefreshKey}`}
          sectionId="projects"
          title="Projects"
          description="Skills used (resolved against the controlled taxonomy), evidence, verification status"
          userId={userId}
          onList={api.listProjects}
          onCreate={api.createProject}
          onDelete={api.deleteProject}
          fields={[
            { name: "title", label: "Project title", required: true },
            { name: "description", label: "Description", required: true },
            { name: "type", label: "Type", type: "select", options: ["personal", "academic", "open_source", "industry"], required: true },
            { name: "skillsUsed", label: "Skills used (comma separated)" },
            { name: "evidenceUrls", label: "Evidence URL" },
          ]}
          buildCreatePayload={async (v, uid) => {
            const { skillsUsed, evidenceUrls, ...projectData } = v;
            return {
            ...projectData,
            userId: uid,
            skills: skillsUsed
              ? (await api.resolveSkillNames(skillsUsed.split(","))).map((skillId) => ({ skillId }))
              : [],
            evidence: evidenceUrls ? [{ type: "link", url: evidenceUrls }] : [],
            };
          }}
          renderItem={(e) => (
            <span>
              {e.title}{" "}
              <span className={`status ${e.verificationStatus === "SelfSubmitted" ? "pending" : "verified"}`}>
                {e.verificationStatus}
              </span>
            </span>
          )}
        /></div>

        <ListPanel
          sectionId="industry-experience"
          title="Industry Experience"
          description="Internships and work experience"
          userId={userId}
          onList={api.listIndustryExperience}
          onCreate={api.createIndustryExperience}
          onDelete={api.deleteIndustryExperience}
          fields={[
            { name: "type", label: "Type", type: "select", options: ["Internship", "WorkExperience"], required: true },
            { name: "companyName", label: "Company name", required: true },
            { name: "role", label: "Role" },
            { name: "startDate", label: "Start date", type: "date" },
            { name: "endDate", label: "End date", type: "date" },
            { name: "skillsUsed", label: "Skills used (comma separated)" },
          ]}
          buildCreatePayload={async (v, uid) => ({
            ...v,
            userId: uid,
            skillsUsed: v.skillsUsed ? await api.resolveSkillNames(v.skillsUsed.split(",")) : [],
          })}
          renderItem={(e) => (
            <span>{e.companyName} <span className="subtitle">· {e.role} · {e.type}</span></span>
          )}
        />

        <IntelligenceSection
          userId={userId}
          onSkillsImported={() => setProfileRefreshKey((value) => value + 1)}
        />

        <div className="card">
          <h2>Evidence & Verification</h2>
          <p className="subtitle">Request Faculty endorsement for project evidence.</p>
          <Link to="/evidence" className="btn">Open verification workspace</Link>
        </div>
      </div>
    </div>
  );
}

function StudentProfileGate({ userId }) {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ bio: "", careerInterest: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    api.getStudentProfile(userId).then((result) => {
      setProfile(result);
      setValues({ bio: result.bio || "", careerInterest: result.careerInterest || "" });
      setEditing(!result.bio && !result.careerInterest);
    }).catch((err) => setError(err.message));
  }, [userId]);

  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      const updated = await api.updateStudentProfile(userId, values);
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!profile) return null;
  if (editing) {
    return <div className="card profile-setup-card"><div className="profile-card-heading"><div><span className="eyebrow">Profile setup</span><h2>Tell us about your direction</h2><p className="subtitle">This takes one minute and helps align your opportunities.</p></div></div>{error && <p className="form-error">{error}</p>}<form onSubmit={save}><textarea value={values.bio} onChange={(event) => setValues({ ...values, bio: event.target.value })} placeholder="Short bio" rows={3} required /><input value={values.careerInterest} onChange={(event) => setValues({ ...values, careerInterest: event.target.value })} placeholder="Career interest or target domain" required /><button type="submit">Save profile</button></form></div>;
  }

  const initials = (profile?.userId ? "AS" : "A");

  return (
    <div className="card profile-readonly-card">
      <div className="profile-card-heading">
        <div>
          <span className="eyebrow">Student profile</span>
          <h2>Aarav Sen</h2>
        </div>
        <div className="profile-readonly-actions">
          <button className="btn-secondary" onClick={() => setEditing(true)}>Edit profile</button>
        </div>
      </div>

      <div className="profile-header-summary">
        <p>Backend Engineer • BTech CSE • Ready for placement</p>
        <span className={`status ${profile.institutionLink?.status === "Linked" ? "verified" : "pending"}`}>
          {profile.institutionLink?.status || "Unlinked"}
        </span>
      </div>

      <p className="plain-copy">{profile.bio}</p>
      <p className="muted-copy">Target direction: {profile.careerInterest}</p>
    </div>
  );
}

function StudentOverview({ userId }) {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getCurrentUser(userId),
      api.getStudentProfile(userId),
      api.getSkillProfile(userId).catch(() => null),
      api.listAcademicRecords(userId),
      api.listTraining(userId),
      api.listProjects(userId),
    ]).then(([user, profile, skillProfile, academics, training, projects]) => {
      const checks = [
        Boolean(user?.name),
        Boolean(profile?.bio || profile?.careerInterest),
        Boolean(skillProfile?.skills?.length),
        Boolean(academics.length || training.length),
        Boolean(projects.length),
      ];
      setOverview({
        user,
        profile,
        skills: (skillProfile?.skills || []).map((skill) => ({
          name: skill.skillId?.canonicalName || skill.skillId?.name || skill.skillId,
          score: skill.score,
          source: skill.source || "self",
        })).filter((skill) => skill.name),
        projects: projects.filter((project) => project.verificationStatus === "Verified").map((project) => ({
          id: project._id,
          title: project.title,
          skills: (project.skills || []).map((skill) => ({
            name: skill.skillId?.canonicalName || skill.skillId?.name || skill.skillId,
          })).filter((skill) => skill.name),
        })),
        completed: checks.filter(Boolean).length,
        total: checks.length,
      });
    }).catch(() => setOverview(null));
  }, [userId]);

  if (!overview) return null;
  const percentage = Math.round((overview.completed / overview.total) * 100);
  return (
    <div className="card student-overview">
      <div className="student-overview-heading">
        <div>
          <p className="eyebrow">Student overview</p>
          <h2>{overview.user.name}</h2>
          <p className="subtitle">{overview.user.email}</p>
        </div>
        <strong>{percentage}% complete</strong>
      </div>
      <div className="completion-track" aria-label={`Profile ${percentage}% complete`}>
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="subtitle" style={{ marginBottom: 0 }}>
        Fill in your background, skills, certifications, and projects to strengthen your placement profile.
      </p>
      {overview.skills.length > 0 && (
        <div className="profile-skills">
          <span className="profile-skills-label">Skills</span>
          <div className="profile-skill-groups">
            {[['self', 'Self-entered'], ['training', 'Certificates & courses'], ['project', 'Verified project']].map(([source, label]) => {
              const skills = overview.skills.filter((skill) => skill.source === source);
              if (!skills.length) return null;
              return <div className="profile-skill-group" key={source}><span>{label}</span><div className="profile-skill-links">{skills.map((skill) => <Link className="profile-skill-link" key={skill.name} to={`/skill/${encodeURIComponent(String(skill.name).toLowerCase())}`}>{skill.name}{skill.score != null ? ` · ${skill.score}/10` : ""}<small>View details</small></Link>)}</div></div>;
            })}
          </div>
        </div>
      )}
      <div className="profile-overview-records">
        <div>
          <span className="profile-skills-label">Verified projects</span>
          {overview.projects.length > 0 ? (
            <div className="profile-project-list">
              {overview.projects.map((project) => (
                <div className="profile-project-row" key={project.id}>
                  <div>
                    <strong>{project.title}</strong>
                    {project.skills.length > 0 && <div className="profile-project-skills">{project.skills.map((skill) => <Link key={skill.name} to={`/skill/${encodeURIComponent(String(skill.name).toLowerCase())}`}>{skill.name}</Link>)}</div>}
                  </div>
                  <span className="status verified">Verified</span>
                </div>
              ))}
            </div>
          ) : <p className="profile-empty">No verified projects yet.</p>}
        </div>
      </div>
    </div>
  );
}

function IndustryOpportunitySection({ userId }) {
  const [opportunities, setOpportunities] = useState([]);
  const [skillIds, setSkillIds] = useState([]);
  const [matches, setMatches] = useState({});
  const [gapResults, setGapResults] = useState({});
  const [gapLoading, setGapLoading] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.listIndustryOpportunities(),
      api.getSkillProfile(userId).catch(() => null),
      api.getIntelligentMatching().catch(() => ({ matches: [] })),
    ])
      .then(([entries, profile, matchResult]) => {
        setOpportunities(entries);
        setSkillIds((profile?.skills || []).map((skill) => String(skill.skillId?._id || skill.skillId)));
        setMatches(Object.fromEntries((matchResult.matches || []).map((match) => [String(match.opportunityId), match])));
      })
      .catch((err) => setError(err.message));
  }, [userId]);

  const visible = opportunities.filter((opportunity) => {
    const opportunitySkills = (opportunity.requiredSkills || []).map((skill) => String(skill.skillId?._id || skill.skillId));
    const matched = opportunitySkills.some((skillId) => skillIds.includes(skillId));
    const text = `${opportunity.title} ${opportunity.description || ""} ${opportunity.organisationId?.name || ""}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) &&
      (type === "all" || opportunity.type === type) &&
      (!matchedOnly || matched);
  }).sort((left, right) => (matches[String(right._id)]?.matchScore || 0) - (matches[String(left._id)]?.matchScore || 0));

  async function calculateGap(opportunityId) {
    setGapLoading(opportunityId);
    try {
      const result = await api.getOpportunitySkillGap(opportunityId);
      setGapResults((current) => ({ ...current, [opportunityId]: result }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGapLoading("");
    }
  }

  return (
    <div className="card">
      <h2>Internships and opportunities</h2>
      <p className="subtitle">Opportunities are matched using the skills in your Skill Profile.</p>
      {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
      <div className="grid opportunity-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, organisation, or description" />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All types</option>
          <option value="internship">Internship</option>
          <option value="apprenticeship">Apprenticeship</option>
          <option value="job">Job</option>
          <option value="live_project">Live project</option>
          <option value="challenge">Challenge</option>
        </select>
        <label className="opportunity-match-filter">
          <input type="checkbox" checked={matchedOnly} onChange={(event) => setMatchedOnly(event.target.checked)} />
          Matched to my skills
        </label>
      </div>
      {visible.length === 0 && <p className="subtitle">No matching opportunities found.</p>}
      {visible.map((opportunity) => {
        const matchingSkills = (opportunity.requiredSkills || []).filter((skill) => skillIds.includes(String(skill.skillId?._id || skill.skillId)));
        const match = matches[String(opportunity._id)];
        const gap = gapResults[String(opportunity._id)];
        return (
          <div className="opportunity-result" key={opportunity._id}>
            <span>
              <Link className="opportunity-title-link" to={`/opportunity/${opportunity._id}`}>{opportunity.title}</Link>
              <br />
              <small>{opportunity.organisationId?.name || "Organisation"} · <span className="opportunity-type">{opportunity.type === "job" ? "Full-time role" : opportunity.type}</span> · {opportunity.mode || "Mode not set"}</small>
              {matchingSkills.length > 0 && <div className="matched-skill-list">{matchingSkills.map((skill) => <span key={String(skill.skillId?._id || skill.skillId)}>{skill.skillId?.name || "Matched skill"}</span>)}</div>}
              {gap && <div className="listing-gap-result"><div className="listing-gap-heading"><strong>Skill gap analysis</strong><span>{Math.round((gap.matchScore || 0) * 100)}% role fit</span></div>{gap.skillGaps.map((item) => <div className="listing-gap-row" key={item.skillId}><span><strong>{item.skillName || friendlySkillId(item.skillId)}</strong><small>{item.gap > 0 ? `${item.gap} points to close` : "Target reached"}</small></span><i><b style={{ width: `${Math.min(item.currentScore * 10, 100)}%` }} /><em style={{ left: `${Math.min(item.targetScore * 10, 100)}%` }} /></i><span className={item.gap > 0 ? "gap-needed" : "gap-ready"}>{item.gap > 0 ? "Needs work" : "Ready"}</span></div>)}</div>}
            </span>
            <span className="opportunity-result-actions"><span className={`status ${matchingSkills.length ? "verified" : "pending"}`}>{match ? `${Math.round(match.matchScore)}% match` : matchingSkills.length ? `${matchingSkills.length} matched` : "Explore"}</span><button className="btn-secondary gap-action" onClick={() => calculateGap(opportunity._id)} disabled={gapLoading === opportunity._id}>{gapLoading === opportunity._id ? "Calculating..." : gap ? "Refresh skill gap" : "Calculate skill gap"}</button></span>
          </div>
        );
      })}
    </div>
  );
}

function InstitutionRequestSection({ userId }) {
  const [institutions, setInstitutions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ institutionId: "", rollNo: "", enrollmentId: "", course: "", admissionYear: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [institution, setInstitution] = useState(null);

  useEffect(() => {
    Promise.all([api.listVerifiedInstitutions(), api.getStudentProfile(userId)])
      .then(([list, current]) => {
        setInstitutions(list);
        setProfile(current);
        setForm((previous) => ({
          ...previous,
          institutionId: current.institutionLink?.institutionId || "",
        }));
        if (current.institutionLink?.institutionId) {
          return api.getInstitution(current.institutionLink.institutionId).then(setInstitution);
        }
      })
      .catch((err) => setError(err.message));
  }, [userId]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const updated = await api.requestInstitutionLink(userId, form);
      setProfile(updated);
      setNotice("Request sent. The institution must verify your student details before you are linked.");
    } catch (err) {
      setError(err.message);
    }
  }

  const link = profile?.institutionLink;
  return (
    <div className="card">
      <h2>Institution Link</h2>
      <p className="subtitle">
        Choose an existing verified institution and submit the details it needs to verify you.
      </p>
      {link?.status && link.status !== "Unlinked" && (
        <p className={`status ${link.status === "Linked" ? "verified" : "pending"}`}>
          {link.status}{link.verificationNote ? ` · ${link.verificationNote}` : ""}
        </p>
      )}
      {institution && (
        <div className="institution-detail">
          <strong>{institution.name}</strong>
          <span>Accreditation ID: {institution.accreditationId}</span>
          <span>Institution status: {institution.verificationStatus}</span>
          {link.rollNo && <span>Roll number: {link.rollNo} · Enrollment: {link.enrollmentId}</span>}
          {link.course && <span>{link.course} · Admission year {link.admissionYear}</span>}
        </div>
      )}
      {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
      {notice && <p className="subtitle">{notice}</p>}
      {link?.status !== "Linked" && (
        <form onSubmit={submit}>
          <select value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: e.target.value })} required>
            <option value="">Select verified institution</option>
            {institutions.map((institution) => (
              <option key={institution._id} value={institution._id}>
                {institution.name}
              </option>
            ))}
          </select>
          <input placeholder="Roll number" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} required />
          <input placeholder="Enrollment ID" value={form.enrollmentId} onChange={(e) => setForm({ ...form, enrollmentId: e.target.value })} required />
          <input placeholder="Course / programme" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} required />
          <input placeholder="Admission year" value={form.admissionYear} onChange={(e) => setForm({ ...form, admissionYear: e.target.value })} required />
          <button type="submit">Request institution verification</button>
        </form>
      )}
    </div>
  );
}

function SkillProfileSection({ userId }) {
  return (
    <SingletonPanel
      title="Skill Profile"
      description="Skills with proficiency levels, resolved against the controlled taxonomy"
      userId={userId}
      onGet={api.getSkillProfile}
      onCreate={api.createSkillProfile}
      onUpdate={api.updateSkillProfile}
      fields={[
        { name: "skillName", label: "Skill name", required: true },
        { name: "score", label: "Skill score (0-10)", type: "number", required: true },
      ]}
      buildCreatePayload={async (v, uid) => {
        const [skillId] = v.skillName ? await api.resolveSkillNames([v.skillName]) : [];
        return { userId: uid, skills: skillId ? [{ skillId, score: Number(v.score), source: "self" }] : [] };
      }}
      buildUpdatePayload={async (v, uid, current) => {
        const [skillId] = v.skillName ? await api.resolveSkillNames([v.skillName]) : [];
        return {
          skills: skillId
            ? [...(current.skills || []), { skillId, score: Number(v.score), source: "self" }]
            : current.skills || [],
        };
      }}
      renderView={(sp) => (
        <div>
          {(sp.skills || []).length === 0 && <p className="subtitle" style={{ marginBottom: 0 }}>No skills added yet.</p>}
          {(sp.skills || []).map((s, i) => (
            <div className="list-item" key={i}>
              <span>
                <Link className="profile-skill-name" to={`/skill/${encodeURIComponent(String(s.skillId?.canonicalName || s.skillId?.name || s.skillId).toLowerCase())}`}>
                  {s.skillId?.canonicalName || s.skillId?.name || s.skillId}
                </Link>{" "}
                <span className="status verified">Score {s.score ?? 0}/10</span>
              </span>
              <Link className="btn-secondary skill-detail-button" to={`/skill/${encodeURIComponent(String(s.skillId?.canonicalName || s.skillId?.name || s.skillId).toLowerCase())}`}>
                View skill details
              </Link>
            </div>
          ))}
        </div>
      )}
    />
  );
}

function IntelligenceSection({ userId, onSkillsImported }) {
  const [careerRoleId, setCareerRoleId] = useState("");
  const [careerRoles, setCareerRoles] = useState([]);
  const [documentText, setDocumentText] = useState("");
  const [skillGap, setSkillGap] = useState(null);
  const [matches, setMatches] = useState(null);
  const [parsedSkills, setParsedSkills] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState("");

  useEffect(() => {
    api.listCareerRoles().then((roles) => {
      setCareerRoles(roles);
      if (roles[0]) setCareerRoleId(String(roles[0]._id));
    }).catch((err) => setError(err.message));
  }, []);

  async function run(action, callback) {
    setError("");
    setLoading(action);
    try {
      await callback();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="card intelligence-card">
      <h2>Certificates and resume skills</h2>
      <p className="subtitle">Paste certificate or resume text to add detected skills to your profile.</p>
      <textarea
        className="intelligence-textarea"
        value={documentText}
        onChange={(event) => setDocumentText(event.target.value)}
        placeholder="Paste resume or certificate text"
        rows={5}
      />
      <button
        disabled={!documentText.trim() || Boolean(loading)}
        onClick={() => run("parse", async () => {
          const parsed = await api.parseResume(documentText);
          const skillNames = parsed.extractedSkillNames || [];
          if (skillNames.length && userId) {
            const skillIds = await api.resolveSkillNames(skillNames);
            const current = await api.getSkillProfile(userId).catch(() => null);
            const existing = current?.skills || [];
            const existingIds = new Set(existing.map((skill) => String(skill.skillId?._id || skill.skillId)));
            const imported = skillIds
              .filter((skillId) => !existingIds.has(String(skillId)))
              .map((skillId) => ({ skillId, score: 0, source: "training", confidence: 25, evidenceCount: 1 }));
            if (imported.length) {
              const skills = [...existing.map((skill) => ({
                skillId: skill.skillId?._id || skill.skillId,
                score: skill.score,
                confidence: skill.confidence,
                evidenceCount: skill.evidenceCount,
                verifiedEvidenceCount: skill.verifiedEvidenceCount,
              })), ...imported];
              if (current) {
                await api.updateSkillProfile(userId, { skills });
              } else {
                await api.createSkillProfile({ userId, skills });
              }
              onSkillsImported?.();
            }
          }
          setParsedSkills({ ...parsed, savedToSkillProfile: skillNames });
        })}
      >
        {loading === "parse" ? "Extracting..." : "Extract and save skills"}
      </button>
      {parsedSkills && <div className="parse-summary"><strong>{parsedSkills.extractedSkillNames?.length || 0} skills found</strong><span>Added to your Skill Profile for review.</span><div>{(parsedSkills.extractedSkillNames || []).map((skill) => <span key={skill}>{skill}</span>)}</div></div>}
      {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
    </div>
  );
}

function SkillGapDashboard({ result }) {
  const gaps = result.skillGaps || [];
  return (
    <section className="intelligence-dashboard">
      <div className="dashboard-heading"><div><span className="dashboard-eyebrow">Role readiness</span><h3>{result.careerRoleName || "Selected career role"}</h3></div><strong>{Math.round((result.matchScore || 0) * 100)}<small>% aligned</small></strong></div>
      <div className="gap-list">{gaps.map((gap) => <div className="gap-card" key={gap.skillId}><div><strong>{friendlySkillId(gap.skillId)}</strong><span>{gap.gap > 0 ? `${gap.gap} points to close` : "Target reached"}</span></div><div className="gap-track"><i style={{ width: `${Math.min(gap.currentScore * 10, 100)}%` }} /><b style={{ left: `${Math.min(gap.targetScore * 10, 100)}%` }} /></div><em className={`gap-priority ${gap.priority}`}>{gap.priority}</em><small>{gap.currentScore}/10 → {gap.targetScore}/10</small></div>)}</div>
    </section>
  );
}

function OpportunityMatchDashboard({ result }) {
  return <section className="match-dashboard"><div className="dashboard-heading"><div><span className="dashboard-eyebrow">Opportunity matches</span><h3>Roles aligned to your skills</h3></div><strong>{(result.matches || []).length}<small> roles</small></strong></div>{(result.matches || []).map((match) => <div className="match-dashboard-row" key={match.opportunityId}><div><strong>{match.title}</strong><span>{match.matchedSkills?.length || 0} skills aligned</span><div className="match-skill-options">{(match.matchedSkills || []).map((skill) => <span className="match-skill-good" key={skill.skillId}>✓ {friendlySkillId(skill.skillId)}</span>)}{(match.missingRequiredSkillIds || []).map((skillId) => <span className="match-skill-gap" key={skillId}>Gap: {friendlySkillId(skillId)}</span>)}</div></div><b>{Math.round(match.matchScore)}%</b></div>)}</section>;
}

function friendlySkillId(skillId) {
  return String(skillId || "Skill").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 32);
}
