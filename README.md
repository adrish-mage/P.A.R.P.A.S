# Skill Portfolio Platform, wired demo

Backend + frontend for the P.A.R.P.A.S. core platform. The MERN backend owns
identity, profiles, skills, evidence, verification, institution workflows,
opportunities, applications, learning enrolments, and shortlists.

The Python intelligence service is intentionally external and optional. The
Node backend returns stable empty/fallback responses until the Python teammate
provides the service and `PYTHON_PREDICTIVE_BASE` is configured.

## You need a MongoDB connection string

I couldn't run this end-to-end myself in this sandbox. No MongoDB
available here (no local install, no internet access to Atlas). You'll
need to see it running on your own machine. Fastest path, no local install:

1. Make a free cluster at https://www.mongodb.com/cloud/atlas/register
2. Get the connection string (Database → Connect → Drivers)
3. Paste it into `backend/.env` as `MONGO_URI=...`

Or if you already have MongoDB installed locally, `MONGO_URI=mongodb://localhost:27017/skill-portfolio` works as-is.

## Run it

Terminal 1:
```
cd backend
npm install
cp .env.example .env   # then edit MONGO_URI in it
npm run dev
```
Should print `MongoDB connected` and `Server running on port 6767`.

Terminal 2:
```
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## Deployment checklist

This repository is demo-ready, but production deployment requires a real
authentication provider or signed session/token middleware. The current UI
passes demo identity headers and is suitable for local demonstrations only.

For a hosted demo:

1. Deploy the backend as a Node service with `npm start`.
2. Set `MONGO_URI` to a reachable MongoDB database.
3. Set `PORT` from the hosting provider and set `FRONTEND_ORIGIN` to the exact
	hosted frontend URL. Multiple comma-separated origins are supported.
4. Keep `DEV_AUTH_BYPASS=false`.
5. Deploy the frontend as a static Vite site with `npm run build` and set
	`VITE_API_BASE=https://<backend-host>/api` at build time.
6. Configure the static host to rewrite unknown routes to `index.html` so
	React Router paths such as `/portal/tpo` work on refresh.

For a fresh database, run `npm run seed:demo` from `backend` once after setting
`MONGO_URI`. This creates the demo student dataset and dedicated TPO and
recruiter professional accounts.

Demo login is passwordless in this prototype. Enter the email in the matching
role form:

- Student: `aarav.sen@sih-demo.local`
- TPO Professional: `tpo-demo@parpas.local`
- Recruiter Professional: `recruiter-demo@parpas.local`
- Organisation: `placements@universityofcalcutta-demo.example`
- Institution: `demo.admin@universityofcalcutta.example`

The organisation and institution forms also accept their seeded names and
codes. These demo identities are intended for controlled demonstrations; real
deployment should replace header-based demo auth with signed sessions or JWT.

The Python predictive service is optional. Without `PYTHON_PREDICTIVE_BASE`,
the Node service returns documented fallback responses for predictive features.

## What to click

1. Landing page → "Get started"
2. Pick "Student" → lands on Student Portal, backend status badge should say "online"
3. Fill the Profile form, select Save, and refresh the page to confirm persistence.
4. Add a skill, academic entry, project, or other record. Each form posts to the backend.
5. Go to Evidence & Verification → shows the Projects/Training you just added with their status

If the backend badge says "offline": your `MONGO_URI` is wrong/missing, or the backend isn't running.
