# Features Blocked Until Python Arrives

The MERN core works without Python. These features currently return empty or
neutral fallback values because they require models or NLP logic:

- Weighted skill-gap scores and missing-skill ranking
- Predictive placement rate and placement-risk insights
- Growth Map skill recommendations
- Resume parsing into controlled taxonomy tags
- Certificate/document parsing into evidence or skills
- Intelligent student-to-opportunity matching and ranking

The Node routes already exist under `/api/insights` and the response contract
is documented in `API_CONTRACT.md`. Configure `PYTHON_PREDICTIVE_BASE` when the
Python teammate delivers a compatible FastAPI service.

The following remain MERN responsibilities and are not blocked by Python:

- User and organisation authentication/session handling
- Student, institution, faculty, TPO, and organisation workflows
- CRUD persistence in MongoDB
- Controlled Skill taxonomy storage and lookup
- Evidence submission, verifier routing, decisions, and audit records
- Internship/placement listings, applications, follows, enrolments, and shortlists
- MongoDB aggregation analytics and recruiter/institution dashboards