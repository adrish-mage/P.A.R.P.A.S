import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { getSessionValue, setSession } from "../session.js";

const DEMO_STUDENT_NAME = "Aarav Sen";
const DEMO_STUDENT_EMAIL = "aarav.sen@sih-demo.local";
const DEMO_PROFESSIONAL_NAME = "PARPAS Demo Professional";
const DEMO_PROFESSIONAL_EMAIL = "professional-demo@parpas.local";
const DEMO_ORGANISATION_NAME = "University of Calcutta";
const DEMO_ORGANISATION_CONTACT = "University of Calcutta Demo";
const DEMO_ORGANISATION_EMAIL = "placements@universityofcalcutta-demo.example";

const digilockerRoles = [
  { key: "Student", label: "Student", desc: "Build and verify your skill profile", path: "/portal/student" },
  { key: "Professional", label: "Professional", desc: "Manage your academic or industry role", path: "/portal/professional" },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [pendingNotice, setPendingNotice] = useState("");
  const [demoApproved, setDemoApproved] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError("");
  }

  function useDemoOrganisation() {
    setError("");
    setForm((current) => ({
      ...current,
      fullName: DEMO_ORGANISATION_CONTACT,
      email: DEMO_ORGANISATION_EMAIL,
      phone: "+91 98765 43210",
      entityName: DEMO_ORGANISATION_NAME,
      registrationId: "CALCUTTADEMO",
      registrationDocUrl: "https://example.com/demo-registration",
    }));
  }

  async function handleDigilocker(e) {
    e.preventDefault();
    setError("");
    try {
      const { user } = await api.digilockerLogin({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        accountType: mode,
      });
      setSession({ userId: user._id, accountType: user.accountType });
      navigate(mode === "Student" ? "/portal/student" : "/portal/professional");
    } catch (err) {
      setError(err.status === 409 ? err.message : err.message || "Unable to continue. Check your details and try again.");
    }
  }

  async function handleCustomPipeline(e) {
    e.preventDefault();
    setError("");
    try {
      const { adminUser, entity } = await api.customPipelineSignup({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        entityType: mode,
        entityName: form.entityName,
        registrationId: form.registrationId,
        registrationDocUrl: form.registrationDocUrl,
      });
      setSession({
        userId: adminUser._id,
        accountType: adminUser.accountType,
        entityId: entity._id,
        entityType: mode,
      });
      if (entity.isVerified) {
        navigate(mode === "Institution" ? "/portal/institution" : "/portal/organisation");
        return;
      }
      setPendingNotice(
        `${mode} "${entity.name}" submitted for review (status: ${entity.isVerified ? "Verified" : "Pending"}). ` +
          `A platform admin must verify accreditation/registration documents before this account can vouch for anyone.`
      );
    } catch (err) {
      setError(err.status === 409 ? err.message : err.message || "Unable to submit this account. Check your details and try again.");
    }
  }

  async function approveAsDemoAdmin() {
    setError("");
    try {
      if (mode === "Institution") {
        await api.verifyInstitution(getSessionValue("entityId"), "Verified", "Demo platform admin approval");
      } else {
        await api.verifyOrganisation(getSessionValue("entityId"), "Verified", "Demo platform admin approval");
      }
      setDemoApproved(true);
      setPendingNotice(`${mode} approved for local demo testing.`);
    } catch (err) {
      setError(err.message);
    }
  }

  const modeHeading = {
    Student: <><span>Build your</span><br /><em>profile.</em></>,
    Professional: <><span>Continue your</span><br /><em>journey.</em></>,
    Institution: <><span>Register your</span><br /><em>institution.</em></>,
    Organisation: <><span>Connect your</span><br /><em>organisation.</em></>,
  };

  if (pendingNotice) {
    return (
      <div className="auth-page auth-simple"><div className="auth-shell"><div className="auth-panel auth-status-panel"><p className="landing-kicker">Verification checkpoint</p><h1>One last<br /><em>check.</em></h1><p className="auth-copy">{pendingNotice}</p>{!demoApproved && <button onClick={approveAsDemoAdmin}>Approve for demo</button>}{demoApproved && mode === "Institution" && <button onClick={() => navigate("/portal/institution")}>Continue to institution portal</button>}{demoApproved && mode === "Organisation" && <button onClick={() => navigate("/portal/organisation")}>Continue to organisation portal</button>}</div></div></div>
    );
  }

  return (
    <div className="auth-page auth-simple"><div className="auth-shell"><div className={`auth-panel ${mode ? "auth-form-panel" : ""}`}>
        {!mode && <><Link to="/" className="role-home-link">← Home</Link><p className="landing-kicker">Choose your role</p><h1>Select your<br /><em>role.</em></h1></>}
        {mode && <><Link to="/" className="auth-back" onClick={() => setMode(null)}>← Change role</Link><p className="landing-kicker">{mode}</p><h1>{modeHeading[mode]}</h1></>}

        {!mode && (
          <div className="auth-roles">
            {digilockerRoles.map((role) => (
              <button className="role-choice" key={role.key} onClick={() => setMode(role.key)}><strong>{role.label}</strong><small>{role.desc}</small></button>
            ))}
            <button className="role-choice" onClick={() => setMode("Institution")}><strong>Institution</strong><small>Track student readiness and placements</small></button>
            <button className="role-choice" onClick={() => setMode("Organisation")}><strong>Organisation</strong><small>Find candidates through aligned skills</small></button>
          </div>
        )}

        {error && <p style={{ color: "#e05c5c" }}>{error}</p>}

        {(mode === "Student" || mode === "Professional") && (
          <form onSubmit={handleDigilocker} className="auth-form"><p className="form-note">Use DigiLocker to create your verified identity.</p>
            <input name="fullName" placeholder="Full name" value={form.fullName || ""} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email || ""} onChange={handleChange} required />
            <input name="phone" placeholder="Phone" value={form.phone || ""} onChange={handleChange} />
            {mode === "Student" && (
              <button type="button" className="btn-secondary" onClick={() => setForm({ fullName: DEMO_STUDENT_NAME, email: DEMO_STUDENT_EMAIL, phone: "+91 98765 43210" })}>
                Use Aarav Sen demo profile
              </button>
            )}
            {mode === "Professional" && (
              <button type="button" className="btn-secondary" onClick={() => setForm({ fullName: DEMO_PROFESSIONAL_NAME, email: DEMO_PROFESSIONAL_EMAIL, phone: "+91 98765 43210" })}>
                Use demo professional
              </button>
            )}
            <button type="submit">Continue with DigiLocker</button>
            <button type="button" className="btn-secondary" onClick={() => setMode(null)} style={{ marginTop: 8 }}>
              Back
            </button>
          </form>
        )}

        {(mode === "Institution" || mode === "Organisation") && (
          <form onSubmit={handleCustomPipeline} className="auth-form"><p className="form-note">Submit your details for platform verification.</p>
            <input name="fullName" placeholder="Admin contact name" value={form.fullName || ""} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Admin email" value={form.email || ""} onChange={handleChange} required />
            <input name="phone" placeholder="Phone" value={form.phone || ""} onChange={handleChange} />
            <input name="entityName" placeholder={`${mode} name`} value={form.entityName || ""} onChange={handleChange} required />
            <input
              name="registrationId"
              placeholder={mode === "Institution" ? "AICTE/UGC ID" : "GSTIN/CIN"}
              value={form.registrationId || ""}
              onChange={handleChange}
              required
            />
            <input name="registrationDocUrl" placeholder="Registration document URL" value={form.registrationDocUrl || ""} onChange={handleChange} />
            {mode === "Organisation" && (
              <button
                type="button"
                className="btn-secondary"
                onClick={useDemoOrganisation}
              >
                Use demo organisation
              </button>
            )}
            <button type="submit">Submit for review</button>
            <button type="button" className="btn-secondary" onClick={() => setMode(null)} style={{ marginTop: 8 }}>
              Back
            </button>
          </form>
        )}
      </div></div></div>
  );
}

function AuthBrand() {
  return <aside className="auth-brand"><Link to="/" className="brand-mark"><span>P</span><strong>P.A.R.P.A.S.</strong><small>Platform for Academia &amp; Recruiters</small></Link><div><span className="auth-serial">Get started</span><p>Aligned skills.<br /><em>Better placements.</em></p></div><footer>Student · Institution<br />Organisation · Recruiter</footer></aside>;
}
