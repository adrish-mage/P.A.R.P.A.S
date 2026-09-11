import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="container">
        <h1>Skill Portfolio Platform</h1>
        <p className="subtitle">
          Build a verified record of your skills, projects, and training,
          endorsed by faculty and institutions, discoverable by recruiters.
        </p>
        <button onClick={() => navigate("/auth")}>Get started</button>
      </div>
    </div>
  );
}
