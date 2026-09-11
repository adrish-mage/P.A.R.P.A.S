import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { getSessionValue, setSession } from "../session.js";

const digilockerRoles = [
  { key: "Student", label: "Student", desc: "DigiLocker · identity only, no institution link required", path: "/portal/student" },
  { key: "Professional", label: "Professional", desc: "DigiLocker · Faculty/TPO/Employee role confirmed later by invite", path: "/portal/professional" },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [pendingNotice, setPendingNotice] = useState("");
  const [demoApproved, setDemoApproved] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
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
      setError(err.message);
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
      setPendingNotice(
        `${mode} "${entity.name}" submitted for review (status: ${entity.isVerified ? "Verified" : "Pending"}). ` +
          `A platform admin must verify accreditation/registration documents before this account can vouch for anyone.`
      );
    } catch (err) {
      setError(err.message);
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

  if (pendingNotice) {
    return (
      <div className="page">
        <div className="container">
          <Link to="/" className="back-link">← Back</Link>
          <h1>Verification pending</h1>
          <p className="subtitle">{pendingNotice}</p>
          {!demoApproved && <button onClick={approveAsDemoAdmin}>Approve as demo platform admin</button>}
          {demoApproved && mode === "Institution" && <button onClick={() => navigate("/portal/institution")}>Continue to institution portal</button>}
          {demoApproved && mode === "Organisation" && <button onClick={() => navigate("/portal/organisation")}>Continue to organisation portal</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/" className="back-link">← Back</Link>
        <h1>Sign in</h1>
        <p className="subtitle">
          Identity (DigiLocker) and role legitimacy (vouched by a verified
          Institution/Organisation) are separate layers: pick the account type
          that matches how you'll be verified.
        </p>

        {!mode && (
          <div className="grid">
            {digilockerRoles.map((role) => (
              <button key={role.key} onClick={() => setMode(role.key)}>
                {role.label}
                <br />
                <small style={{ fontWeight: "normal", opacity: 0.8 }}>{role.desc}</small>
              </button>
            ))}
            <button onClick={() => setMode("Institution")}>
              Institution
              <br />
              <small style={{ fontWeight: "normal", opacity: 0.8 }}>Custom Pipeline · accreditation review</small>
            </button>
            <button onClick={() => setMode("Organisation")}>
              Organisation
              <br />
              <small style={{ fontWeight: "normal", opacity: 0.8 }}>Custom Pipeline · business registration review</small>
            </button>
          </div>
        )}

        {error && <p style={{ color: "#e05c5c" }}>{error}</p>}

        {(mode === "Student" || mode === "Professional") && (
          <form onSubmit={handleDigilocker} className="card">
            <h2>{mode} · DigiLocker (dummy)</h2>
            <p className="subtitle">
              Real integration exchanges a DigiLocker auth code server-side. This
              form stands in for that redirect until it's wired up.
            </p>
            <input name="fullName" placeholder="Full name" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
            <input name="phone" placeholder="Phone" onChange={handleChange} />
            <button type="submit">Continue with DigiLocker</button>
            <button type="button" className="btn-secondary" onClick={() => setMode(null)} style={{ marginTop: 8 }}>
              Back
            </button>
          </form>
        )}

        {(mode === "Institution" || mode === "Organisation") && (
          <form onSubmit={handleCustomPipeline} className="card">
            <h2>{mode} · Custom Pipeline</h2>
            <p className="subtitle">
              A platform admin manually reviews {mode === "Institution" ? "accreditation (AICTE/UGC)" : "registration (GSTIN/CIN)"} before this account can vouch for anyone.
            </p>
            <input name="fullName" placeholder="Admin contact name" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Admin email" onChange={handleChange} required />
            <input name="phone" placeholder="Phone" onChange={handleChange} />
            <input name="entityName" placeholder={`${mode} name`} onChange={handleChange} required />
            <input
              name="registrationId"
              placeholder={mode === "Institution" ? "AICTE/UGC ID" : "GSTIN/CIN"}
              onChange={handleChange}
              required
            />
            <input name="registrationDocUrl" placeholder="Registration document URL" onChange={handleChange} />
            <button type="submit">Submit for review</button>
            <button type="button" className="btn-secondary" onClick={() => setMode(null)} style={{ marginTop: 8 }}>
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
