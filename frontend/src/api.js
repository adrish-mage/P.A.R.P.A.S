const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";
import { getSessionValue } from "./session.js";

async function request(path, options = {}) {
  const userId = getSessionValue("userId");
  const accountType = getSessionValue("accountType");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "x-user-id": userId } : {}),
      ...(accountType ? { "x-account-type": accountType } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
  }
  if (!res.ok) {
    const err = new Error(body?.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

const post = (path, data) => request(path, { method: "POST", body: JSON.stringify(data) });
const put = (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) });
const del = (path) => request(path, { method: "DELETE" });

export const api = {
  health: () => request("/health"),

  digilockerLogin: (data) => post("/auth/digilocker", data),
  customPipelineSignup: (data) => post("/auth/custom-pipeline", data),
  addAdminSubUser: (data) => post("/auth/admin-sub-user", data),
  getCurrentUser: (userId) => request(`/auth/me/${userId}`),

  getInstitution: (id) => request(`/institutions/${id}`),
  listVerifiedInstitutions: () => request("/institutions/verified"),
  listPendingInstitutions: () => request(`/institutions/pending`),
  verifyInstitution: (id, decision, note) => put(`/institutions/${id}/verify`, { decision, note }),
  linkStudents: (id, students) => post(`/institutions/${id}/link-students`, { students }),
  inviteToInstitution: (id, email, role) => post(`/institutions/${id}/invite`, { email, role }),
  listLinkedProfessionals: (institutionId, role) =>
    request(`/institutions/${institutionId}/professionals${role ? `?role=${role}` : ""}`),
  listStudentRequests: (institutionId) => request(`/institutions/${institutionId}/student-requests`),
  decideStudentRequest: (institutionId, userId, decision, note) =>
    put(`/institutions/${institutionId}/student-requests/${userId}`, { decision, note }),

  getOrganisation: (id) => request(`/organisations/${id}`),
  listPendingOrganisations: () => request(`/organisations/pending`),
  verifyOrganisation: (id, decision, note) => put(`/organisations/${id}/verify`, { decision, note }),
  inviteEmployee: (id, email) => post(`/organisations/${id}/invite`, { email }),
  listOrganisationCandidates: (query = "") => request(`/organisations/candidates${query ? `?q=${encodeURIComponent(query)}` : ""}`),

  listMembershipsForUser: (userId) => request(`/memberships/user/${userId}`),
  acceptInvite: (id) => put(`/memberships/${id}/accept`, {}),
  declineInvite: (id) => put(`/memberships/${id}/decline`, {}),

  getStudentProfile: (userId) => request(`/student-profile/${userId}`),
  updateStudentProfile: (userId, data) => put(`/student-profile/${userId}`, data),
  requestInstitutionLink: (userId, data) => put(`/student-profile/${userId}/request-link`, data),
  consentToInstitutionLink: (userId) => put(`/student-profile/${userId}/consent-link`, {}),
  approveInstitutionLink: (userId) => put(`/student-profile/${userId}/approve-link`, {}),

  getProfessionalProfile: (userId) => request(`/professional-profile/${userId}`),
  updateProfessionalProfile: (userId, data) => put(`/professional-profile/${userId}`, data),

  requestVerification: (data) => post(`/verification/request`, data),
  decideVerification: (data) => post(`/verification/decide`, data),
  getVerificationInbox: (endorserId) => request(`/verification/inbox/${endorserId}`),
  getVerificationAuditTrail: (entryType, entryId) => request(`/verification/entry/${entryType}/${entryId}`),

  searchSkills: (query) => request(`/skills${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  createSkill: (data) => post(`/skills`, data),

  resolveSkillNames: async (names) => {
    const ids = [];
    for (const raw of names) {
      const name = raw.trim();
      if (!name) continue;
      const matches = await api.searchSkills(name);
      const exact = matches.find(
        (m) => m.name.toLowerCase() === name.toLowerCase() || (m.aliases || []).some((a) => a.toLowerCase() === name.toLowerCase())
      );
      if (exact) {
        ids.push(exact._id);
      } else {
        const created = await api.createSkill({ name, category: "technical" });
        ids.push(created._id);
      }
    }
    return ids;
  },

  getSkillProfile: (userId) => request(`/skill-profile/${userId}`),
  createSkillProfile: (data) => post(`/skill-profile`, data),
  updateSkillProfile: (userId, data) => put(`/skill-profile/${userId}`, data),

  listAcademicRecords: (userId) => request(`/academic-records/user/${userId}`),
  createAcademicRecord: (data) => post(`/academic-records`, data),
  deleteAcademicRecord: (id) => del(`/academic-records/${id}`),

  listTraining: (userId) => request(`/training/user/${userId}`),
  createTraining: (data) => post(`/training`, data),
  deleteTraining: (id) => del(`/training/${id}`),

  listProjects: (userId) => request(`/projects/user/${userId}`),
  createProject: (data) => post(`/projects`, data),
  deleteProject: (id) => del(`/projects/${id}`),

  listIndustryExperience: (userId) => request(`/industry-experience/user/${userId}`),
  createIndustryExperience: (data) => post(`/industry-experience`, data),
  deleteIndustryExperience: (id) => del(`/industry-experience/${id}`),

  getGrowthMap: (userId) => request(`/growth-map/${userId}`),
  createGrowthMap: (data) => post(`/growth-map`, data),
  updateGrowthMap: (userId, data) => put(`/growth-map/${userId}`, data),

  listLearningOpportunities: () => request(`/learning-opportunities`),

  getSkillGap: (data) => post(`/insights/skill-gap`, data),
  getPlacementInsights: (data) => post(`/insights/placement`, data),
  getGrowthMapRecommendation: (data) => post(`/insights/growth-map-recommend`, data),
  parseResume: (documentUrl) => post(`/insights/resume-parse`, { documentUrl }),

  listIndustryOpportunities: (query = "") => request(`/industry-opportunities${query ? `?${query}` : ""}`),
  getIndustryOpportunity: (id) => request(`/industry-opportunities/${id}`),
  createIndustryOpportunity: (data) => post(`/industry-opportunities`, data),
  updateIndustryOpportunity: (id, data) => put(`/industry-opportunities/${id}`, data),
  deleteIndustryOpportunity: (id) => del(`/industry-opportunities/${id}`),
  applyToIndustryOpportunity: (industryOpportunityId, coverNote) =>
    post(`/industry-applications`, { industryOpportunityId, coverNote }),
  listMyIndustryApplications: () => request(`/industry-applications/mine`),
  withdrawIndustryApplication: (id) => put(`/industry-applications/${id}/withdraw`, {}),
  listOrganisationApplications: (opportunityId) =>
    request(`/industry-applications/organisation${opportunityId ? `?opportunityId=${opportunityId}` : ""}`),
  updateIndustryApplication: (id, status, reviewNote) =>
    put(`/industry-applications/${id}/status`, { status, reviewNote }),
  followOrganisation: (organisationId) => post(`/industry-follow`, { organisationId }),
  listFollowedOrganisations: () => request(`/industry-follow`),
  unfollowOrganisation: (id) => del(`/industry-follow/${id}`),
  enrolLearning: (opportunityId) => post(`/learning-enrollments`, { opportunityId }),
  listLearningEnrollments: () => request(`/learning-enrollments`),
  updateLearningEnrollment: (id, data) => put(`/learning-enrollments/${id}`, data),
  shortlistCandidate: (data) => post(`/opportunity-shortlist`, {
    ...data,
    opportunityId: data.opportunityId || data.industryOpportunityId,
  }),
  listOrganisationShortlist: () => request(`/opportunity-shortlist`),
  updateShortlist: (id, data) => put(`/opportunity-shortlist/${id}`, data),
};
