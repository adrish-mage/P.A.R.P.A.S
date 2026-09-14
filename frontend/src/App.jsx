import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import StudentPortal from "./pages/StudentPortal.jsx";
import ProfessionalHome from "./pages/ProfessionalHome.jsx";
import FacultyPortal from "./pages/FacultyPortal.jsx";
import TPOPortal from "./pages/TPOPortal.jsx";
import InstitutionPortal from "./pages/InstitutionPortal.jsx";
import EvidenceVerification from "./pages/EvidenceVerification.jsx";
import RecruiterPortal from "./pages/RecruiterPortal.jsx";
import OrganisationPortal from "./pages/OrganisationPortal.jsx";
import SkillDetailPage from "./pages/SkillDetailPage.jsx";
import ReadOnlyCandidatePage from "./pages/ReadOnlyCandidatePage.jsx";

export default function App() {
  return (
    <>
      <PreviousPageControl />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/portal/student" element={<StudentPortal />} />
        <Route path="/portal/professional" element={<ProfessionalHome />} />
        <Route path="/portal/faculty" element={<FacultyPortal />} />
        <Route path="/portal/tpo" element={<TPOPortal />} />
        <Route path="/portal/institution" element={<InstitutionPortal />} />
        <Route path="/portal/organisation" element={<OrganisationPortal />} />
        <Route path="/evidence" element={<EvidenceVerification />} />
        <Route path="/recruiter" element={<RecruiterPortal />} />
        <Route path="/candidate/:studentId" element={<ReadOnlyCandidatePage />} />
        <Route path="/skill/:skillName" element={<SkillDetailPage />} />
      </Routes>
    </>
  );
}

function PreviousPageControl() {
  const location = useLocation();
  const navigate = useNavigate();
  const hidden = location.pathname === "/" || location.pathname === "/auth";
  if (hidden) return null;

  const labels = {
    "/portal/student": "Student Portal",
    "/portal/professional": "Professional Account",
    "/portal/faculty": "Faculty Portal",
    "/portal/tpo": "TPO Portal",
    "/portal/institution": "Institution Portal",
    "/portal/organisation": "Organisation Portal",
    "/evidence": "Evidence & Verification",
    "/recruiter": "Candidate Analysis",
  };
  const label = location.state?.fromLabel || labels[location.pathname] || "Previous Page";

  return (
    <div className="global-page-navigation">
      <button type="button" className="global-back-button" onClick={() => navigate(-1)}>← Back to {label}</button>
    </div>
  );
}
