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

## What to click

1. Landing page → "Get started"
2. Pick "Student" → lands on Student Portal, backend status badge should say "online"
3. Fill the Profile form, select Save, and refresh the page to confirm persistence.
4. Add a skill, academic entry, project, or other record. Each form posts to the backend.
5. Go to Evidence & Verification → shows the Projects/Training you just added with their status

If the backend badge says "offline": your `MONGO_URI` is wrong/missing, or the backend isn't running.
