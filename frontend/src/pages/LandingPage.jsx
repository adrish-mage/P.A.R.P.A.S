import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <main className="landing-main">
        <section className="landing-hero">
          <div className="hero-copy">
            <h1>P.A.R.P.A.S.</h1>
            <p className="hero-full-name">Platform for Academia & Recruiters  &amp; Placements via Aligned Skills </p>
            <p className="hero-intro">A verified skill platform that connects academic capability with recruiter demand.</p>
            <button className="hero-cta" onClick={() => navigate("/auth")}>Get started</button>
          </div>
        </section>
      </main>
    </div>
  );
}
