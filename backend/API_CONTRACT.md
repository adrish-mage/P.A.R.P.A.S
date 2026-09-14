# P.A.R.P.A.S. Backend Handoff Contract

This document defines the MERN-owned boundary for the Python/FastAPI teammate.

## Ownership

Node/MERN owns authentication, users, institutions, organisations, profiles,
controlled skills, academic/training/project/experience records, evidence and
verification audit records, opportunities, follows, applications, learning
enrolments, shortlists, and MongoDB persistence.

Python/FastAPI owns prediction and NLP only. It must not connect to MongoDB.
Node assembles verified data, calls Python, and persists returned references.

## Intelligence endpoints

Base URL: optional `PYTHON_PREDICTIVE_BASE`. If unset, Node returns stable
fallback responses and the MERN platform continues to work without Python.

### `POST /skill-gap`

Request:

```json
{
  "studentSkills": [
    {
      "skillId": "skill-object-id",
      "score": 7
    }
  ],
  "targetRoleSkills": [
    {
      "skillId": "skill-object-id",
      "targetLevel": 8,
      "weight": 0.4
    }
  ]
}

Response:

```json
{
  "skillGaps": [
    {
      "skillId": "skill-object-id",
      "currentScore": 7,
      "targetScore": 8,
      "gap": 1,
      "weight": 0.4,
      "attainment": 0.875,
      "priority": 0.4
    }
  ],
  "matchScore": 0.7357
}


### `POST /placement-insights`

Request:

```json
{
  "institutionId": "institution-object-id",
  "cohort": "2026",
  "students": []
}
```

Response:

```json
{
  "predictedPlacementRate": 0.72,
  "topSkillGaps": ["skill-object-id"],
  "note": "optional diagnostic"
}
```

### `POST /growth-map/recommend`

Node assembles the predictive payload from the authenticated student's
SkillProfile, the selected CareerRole, and currently available
LearningOpportunity records.

Node → Python request:

```json
{
  "studentSkills": [
    {
      "skillId": "skill-object-id",
      "score": 7
    }
  ],
  "targetRoleSkills": [
    {
      "skillId": "skill-object-id",
      "targetLevel": 8,
      "weight": 0.4
    }
  ],
  "learningOpportunities": [
    {
      "opportunityId": "learning-opportunity-object-id",
      "title": "Docker for Developers",
      "skills": [
        {
          "skillId": "skill-object-id",
          "targetLevel": 7,
          "required": true,
          "weight": 1
        }
      ]
    }
  ]
}
```

Response:

```json
{
  "skillGaps": [
    {
      "skillId": "skill-object-id",
      "currentScore": 3,
      "targetScore": 7,
      "gap": 4,
      "weight": 0.2,
      "priority": "high"
    }
  ],
  "recommendations": [
    {
      "opportunityId": "learning-opportunity-object-id",
      "title": "Docker for Developers",
      "reason": "Addresses the student's current skill gaps in: skill-object-id.",
      "targetSkills": [
        {
          "skillId": "skill-object-id",
          "expectedImprovement": 4
        }
      ],
      "priority": 80
    }
  ]
}
```

Node saves `recommendedSkillIds` into `GrowthMap.recommendedSkills`.

### `POST /resume-parse`

Request:

```json
{ "documentUrl": "https://example.test/resume.pdf" }
```

Response:

```json
{
  "extractedSkillNames": ["React", "MongoDB"],
  "note": "optional diagnostic"
}
```

Node is responsible for resolving extracted names against the controlled Skill
taxonomy. Python should not create taxonomy records.

## Placement endpoints

- `GET /api/industry-opportunities` lists open opportunities and populated organisation/skill metadata.
- `POST /api/industry-opportunities` requires a verified organisation admin.
- `POST /api/industry-applications` lets the authenticated student apply.
- `GET /api/industry-applications/mine` lists the student's applications.
- `GET /api/industry-applications/organisation` lists applications for the authenticated organisation.
- `PUT /api/industry-applications/:id/status` lets the owning organisation move an application through review states.
- `POST /api/industry-follow` and `GET /api/industry-follow` manage student organisation follows.
- `POST /api/learning-enrollments` and `GET /api/learning-enrollments` manage student learning enrolments.
- `POST /api/opportunity-shortlist` and `GET /api/opportunity-shortlist` manage organisation shortlists.

## Controlled taxonomy rule

`Skill` IDs are the persisted contract. Project, training, academic,
experience, profile, opportunity, and Python payloads should use Skill IDs.
Free text is a UI input convenience only and must be resolved before storage.
