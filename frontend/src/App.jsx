import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
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
    </Routes>
  );
}
