import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { clearSession, getUserId } from "../session.js";
import SingletonPanel from "../components/SingletonPanel.jsx";
import ListPanel from "../components/ListPanel.jsx";

export default function StudentPortal() {
  const userId = getUserId();
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    api
      .health()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

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
        <StudentOverview userId={userId} />
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

        <SingletonPanel
          title="Student Profile"
          description="Institution link is an optional, later-stage upgrade, not a signup requirement"
          userId={userId}
          onGet={api.getStudentProfile}
          onUpdate={api.updateStudentProfile}
          onCreate={() => Promise.reject(new Error("Student profile is created automatically on DigiLocker sign-in"))}
          fields={[
            { name: "bio", label: "Bio" },
            { name: "careerInterest", label: "Career interest / target domain" },
          ]}
          renderView={(p) => (
            <div>
              {p.bio && <p>{p.bio}</p>}
              {p.careerInterest && <p className="subtitle">Target domain: {p.careerInterest}</p>}
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Institution link:{" "}
                <span className={`status ${p.institutionLink?.status === "Linked" ? "verified" : "pending"}`}>
                  {p.institutionLink?.status || "Unlinked"}
                </span>
              </p>
              {p.institutionLink?.status === "PendingStudentConsent" && (
                <button style={{ marginTop: 8 }} onClick={() => api.consentToInstitutionLink(userId).then(() => window.location.reload())}>
                  Consent to institution link
                </button>
              )}
            </div>
          )}
        />

        <InstitutionRequestSection userId={userId} />

        <IndustryOpportunitySection userId={userId} />

        <SkillProfileSection userId={userId} />

        <ListPanel
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
        />

        <ListPanel
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
        />

        <ListPanel
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
        />

        <ListPanel
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

        <SingletonPanel
          title="Growth Map"
          description="Target role and recommended skills (recommendedSkills is filled by the Python service, not editable here)"
          userId={userId}
          onGet={api.getGrowthMap}
          onCreate={api.createGrowthMap}
          onUpdate={api.updateGrowthMap}
          fields={[{ name: "targetRole", label: "Target role", required: true }]}
          buildCreatePayload={(v, uid) => ({ userId: uid, targetRole: v.targetRole })}
          renderView={(g) => (
            <div>
              <p><strong>Target role:</strong> {g.targetRole || "Not set"}</p>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                Recommended skills: {(g.recommendedSkills || []).length ? g.recommendedSkills.length : "Pending. Python service is not wired in yet"}
              </p>
            </div>
          )}
        />

        <div className="card">
          <h2>Evidence & Verification</h2>
          <p className="subtitle">Request Faculty endorsement for project evidence. OCR and NLP processing will be added by the Python service.</p>
          <Link to="/evidence" className="btn">Open verification workspace</Link>
        </div>
      </div>
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
      setOverview({ user, profile, completed: checks.filter(Boolean).length, total: checks.length });
    }).catch(() => setOverview(null));
  }, [userId]);

  if (!overview) return null;
  const percentage = Math.round((overview.completed / overview.total) * 100);
  return (
    <div className="card student-overview">
      <div className="student-overview-heading">
        <div>
          <p className="eyebrow">Your profile</p>
          <h2>{overview.user.name}</h2>
          <p className="subtitle">{overview.user.email}</p>
        </div>
        <strong>{percentage}% complete</strong>
      </div>
      <div className="completion-track" aria-label={`Profile ${percentage}% complete`}>
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="subtitle" style={{ marginBottom: 0 }}>
        Add your bio, skills, certifications, academic records, and projects to complete your profile.
      </p>
    </div>
  );
}

function IndustryOpportunitySection({ userId }) {
  const [opportunities, setOpportunities] = useState([]);
  const [skillIds, setSkillIds] = useState([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [matchedOnly, setMatchedOnly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.listIndustryOpportunities(),
      api.getSkillProfile(userId).catch(() => null),
    ])
      .then(([entries, profile]) => {
        setOpportunities(entries);
        setSkillIds((profile?.skills || []).map((skill) => String(skill.skillId)));
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
  });

  return (
    <div className="card">
      <h2>Internships and opportunities</h2>
      <p className="subtitle">Opportunities are matched using the skills in your Skill Profile.</p>
      {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
      <div className="grid">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, organisation, or description" />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All types</option>
          <option value="internship">Internship</option>
          <option value="apprenticeship">Apprenticeship</option>
          <option value="job">Job</option>
          <option value="live_project">Live project</option>
          <option value="challenge">Challenge</option>
        </select>
        <label>
          <input type="checkbox" checked={matchedOnly} onChange={(event) => setMatchedOnly(event.target.checked)} />
          Matched to my skills
        </label>
      </div>
      {visible.length === 0 && <p className="subtitle">No matching opportunities found.</p>}
      {visible.map((opportunity) => {
        const matchingSkills = (opportunity.requiredSkills || []).filter((skill) => skillIds.includes(String(skill.skillId?._id || skill.skillId)));
        return (
          <div className="list-item" key={opportunity._id}>
            <span>
              <strong>{opportunity.title}</strong>
              <br />
              <small>{opportunity.organisationId?.name || "Organisation"} · {opportunity.mode || "Mode not set"} · {matchingSkills.length} matched skills</small>
            </span>
            <span className={`status ${matchingSkills.length ? "verified" : "pending"}`}>
              {matchingSkills.length ? "Matched" : "Explore"}
            </span>
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
                {institution.name} · {institution.accreditationId}
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
        { name: "proficiencyLevel", label: "Proficiency", type: "select", options: ["Beginner", "Intermediate", "Advanced", "Expert"] },
      ]}
      buildCreatePayload={async (v, uid) => {
        const [skillId] = v.skillName ? await api.resolveSkillNames([v.skillName]) : [];
        return { userId: uid, skills: skillId ? [{ skillId, proficiencyLevel: v.proficiencyLevel || "Beginner" }] : [] };
      }}
      buildUpdatePayload={async (v, uid, current) => {
        const [skillId] = v.skillName ? await api.resolveSkillNames([v.skillName]) : [];
        return {
          skills: skillId
            ? [...(current.skills || []), { skillId, proficiencyLevel: v.proficiencyLevel || "Beginner" }]
            : current.skills || [],
        };
      }}
      renderView={(sp) => (
        <div>
          {(sp.skills || []).length === 0 && <p className="subtitle" style={{ marginBottom: 0 }}>No skills added yet.</p>}
          {(sp.skills || []).map((s, i) => (
            <div className="list-item" key={i}>
              <span>{s.skillId?.canonicalName || s.skillId}</span>
              <span className="status verified">{s.proficiencyLevel}</span>
            </div>
          ))}
        </div>
      )}
    />
  );
}
