import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { clearSession, getSessionValue } from "../session.js";

export default function InstitutionPortal() {
  const entityId = getSessionValue("entityId");
  const [institution, setInstitution] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Faculty");
  const [studentEmail, setStudentEmail] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [studentRequests, setStudentRequests] = useState([]);
  const [linkedFaculty, setLinkedFaculty] = useState([]);
  const [linkedTpo, setLinkedTpo] = useState([]);
  const [entityMissing, setEntityMissing] = useState(false);

  useEffect(() => {
    if (entityId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      const [inst, requests, faculty, tpo] = await Promise.all([
        api.getInstitution(entityId),
        api.listStudentRequests(entityId),
        api.listLinkedProfessionals(entityId, "Faculty"),
        api.listLinkedProfessionals(entityId, "TPO"),
      ]);
      setInstitution(inst);
      setStudentRequests(requests);
      setLinkedFaculty(faculty);
      setLinkedTpo(tpo);
    } catch (err) {
      if (err.status === 404) setEntityMissing(true);
      setError(err.message);
    }
  }

  async function decideStudent(userId, decision) {
    try {
      await api.decideStudentRequest(entityId, userId, decision, decision === "Verified" ? "Student details verified" : "Student details could not be verified");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function selfVerifyForDemo() {
    try {
      const inst = await api.verifyInstitution(entityId, "Verified", "Demo self-approval. Replace with real admin review.");
      setInstitution(inst);
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendInvite(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await api.inviteToInstitution(entityId, inviteEmail, inviteRole);
      setNotice(`Invite sent to ${inviteEmail} as ${inviteRole}. They must accept it from their Professional account.`);
      setInviteEmail("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendStudentLink(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const { results } = await api.linkStudents(entityId, [{ email: studentEmail, rollNo }]);
      setNotice(`Link result: ${results[0]?.status}`);
      setStudentEmail("");
      setRollNo("");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!entityId) {
    return (
      <div className="page">
        <div className="container">
          <h1>Not signed in as an Institution</h1>
          <Link to="/auth" className="btn">Go to sign in</Link>
        </div>
      </div>
    );
  }

  if (entityMissing) {
    return (
      <div className="page">
        <div className="container">
          <h1>Institution session expired</h1>
          <p className="subtitle">This institution no longer exists. Start a new demo account to continue.</p>
          <Link to="/auth" className="btn" onClick={clearSession}>Start new demo account</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/auth" className="back-link" onClick={clearSession}>← Sign out</Link>
        <h1>Institution Portal</h1>
        <p className="subtitle">Manage verified people, student requests, and institution relationships.</p>

        {error && <p style={{ color: "#e05c5c" }}>{error}</p>}
        {notice && <p className="subtitle">{notice}</p>}

        <div className="card">
          <h2>Verification status</h2>
          <p className={`status ${institution?.isVerified ? "verified" : "pending"}`}>
            {institution ? (institution.isVerified ? "Verified" : "Pending") : "Loading…"}
          </p>
          {institution && !institution.isVerified && (
            <button style={{ marginTop: 8 }} onClick={selfVerifyForDemo}>
              (Demo) Approve as platform admin
            </button>
          )}
        </div>

        {institution?.isVerified && (
          <>
            <div className="summary-grid">
              <SummaryStat label="Linked students" value={studentRequests.filter((item) => item.status === "approved").length} />
              <SummaryStat label="Pending students" value={studentRequests.filter((item) => item.status === "pending").length} />
              <SummaryStat label="Professionals" value={linkedFaculty.length + linkedTpo.length} />
            </div>

            <div className="card">
              <div className="section-heading">
                <div>
                  <h2>Linked Faculty</h2>
                  <p className="subtitle">Faculty members who can review student evidence.</p>
                </div>
                <span className="status verified">{linkedFaculty.length}</span>
              </div>
              <PeopleList people={linkedFaculty} empty="No linked Faculty yet." />
            </div>

            <div className="card">
              <div className="section-heading">
                <div>
                  <h2>Linked TPO</h2>
                  <p className="subtitle">Training and placement contacts connected to this institution.</p>
                </div>
                <span className="status verified">{linkedTpo.length}</span>
              </div>
              <PeopleList people={linkedTpo} empty="No linked TPO yet." />
            </div>

            <div className="card">
              <h2>Students</h2>
              <StudentGroup
                title="Pending verification"
                students={studentRequests.filter((item) => item.status === "pending")}
                action={decideStudent}
                empty="No pending student requests."
              />
              <StudentGroup
                title="Linked students"
                students={studentRequests.filter((item) => item.status === "approved")}
                empty="No linked students yet."
              />
            </div>

            <div className="card">
              <h2>Invite Faculty / TPO</h2>
              <form onSubmit={sendInvite}>
                <input placeholder="Professional's email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="Faculty">Faculty</option>
                  <option value="TPO">TPO</option>
                </select>
                <button type="submit">Send invite</button>
              </form>
            </div>

            <div className="card">
              <h2>Link Student</h2>
              <p className="subtitle">Student must already have a Student account (DigiLocker) with this email.</p>
              <form onSubmit={sendStudentLink}>
                <input placeholder="Student's email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />
                <input placeholder="Roll no." value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
                <button type="submit">Link</button>
              </form>
            </div>
          </>
        )}

        <div className="card">
          <h2>College Analytics · Skill Statistics</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>
            MongoDB aggregation dashboards are not built yet. Wire them against
            AcademicRecord/SkillProfile once there's a students-by-institution index.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="summary-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PeopleList({ people, empty }) {
  if (people.length === 0) return <p className="subtitle" style={{ marginBottom: 0 }}>{empty}</p>;
  return people.map((person) => (
    <div className="list-item" key={person._id}>
      <span>
        <strong>{person.userId?.name || "Unnamed professional"}</strong>
        <br />
        <small>{person.userId?.email || "No email"}</small>
      </span>
      <span className="status verified">Linked</span>
    </div>
  ));
}

function StudentGroup({ title, students, action, empty }) {
  return (
    <div className="student-group">
      <div className="section-heading">
        <h3>{title}</h3>
        <span className="status">{students.length}</span>
      </div>
      {students.length === 0 && <p className="subtitle">{empty}</p>}
      {students.map((student) => (
        <div className="list-item" key={student.applicantUserId?._id || student._id}>
          <span>
            <strong>{student.applicantUserId?.name || "Student"}</strong> · {student.applicantUserId?.email}
            {student.studentDetails && (
              <small style={{ display: "block", marginTop: 4 }}>
                Roll: {student.studentDetails.rollNo || "Not provided"} · Enrollment: {student.studentDetails.enrollmentId || "Not provided"} · {student.studentDetails.course || "Course not provided"} · Admission year: {student.studentDetails.admissionYear || "Not provided"}
              </small>
            )}
          </span>
          {action && (
            <span>
              <button onClick={() => action(student.applicantUserId._id, "Verified")}>Verify</button>{" "}
              <button className="btn-secondary" onClick={() => action(student.applicantUserId._id, "Rejected")}>Reject</button>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
