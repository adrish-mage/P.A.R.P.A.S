# P.A.R.P.A.S. Backend Handoff Contract

This document defines the MERN-owned boundary for the Python/FastAPI predictive
and NLP service.

## Ownership

Node/MERN owns authentication, users, institutions, organisations, profiles,
controlled skills, academic/training/project/experience records, evidence and
verification audit records, opportunities, follows, applications, learning
enrolments, shortlists, GrowthMap persistence, and MongoDB persistence.

Python/FastAPI owns prediction and NLP only. It must not connect to MongoDB.
Node assembles verified data, calls Python, and persists returned references or
results where the owning workflow requires persistence.

## Intelligence service

Base URL: `PYTHON_PREDICTIVE_BASE`.

If the base URL is unset or the Python service is unavailable, Node returns a
stable fallback response for the corresponding intelligence operation.

Python endpoints are internal intelligence endpoints. Their IDs are opaque
strings from Node. Python must not attempt to query or validate MongoDB IDs.

---

## 1. Skill Gap

### Python: `POST /skill-gap`

Node obtains the student's active SkillProfile and the selected active
CareerRole from MongoDB.

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
```

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
      "priority": "low"
    }
  ],
  "matchScore": 0.7357
}
```

The role weight is used by Python when calculating weighted gaps and priority.
Node remains responsible for persistence and authoritative Skill/CareerRole
references.

---

## 2. Growth Map

### Python: `POST /growth-map/recommend`

Node obtains the active student's SkillProfile, selected CareerRole, and
eligible LearningOpportunity records from MongoDB.

Request:

```json
{
  "studentSkills": [
    {
      "skillId": "skill-object-id",
      "score": 3
    }
  ],
  "targetRoleSkills": [
    {
      "skillId": "skill-object-id",
      "targetLevel": 7,
      "weight": 0.6
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
      "weight": 0.6,
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
      "priority": 60
    }
  ]
}
```

Node persists the generated result into the authoritative `GrowthMap` model.
The Python response may contain `weight` as predictive metadata; Node should
store only fields supported by the current GrowthMap schema.

Growth Map generation is exposed through `POST /api/insights/growth-map-recommend`.
The generic `POST /api/growth-map` route is not required for predictive
creation.

---

## 3. Placement Insights

### Python: `POST /placement-insights`

Node assembles institution/cohort data from MongoDB. The current implementation
is a deterministic readiness baseline because the current data model does not
contain historical placement outcomes suitable for supervised training.

Request:

```json
{
  "institutionId": "institution-object-id",
  "cohort": "2026",
  "students": [
    {
      "studentId": "student-object-id",
      "readinessScore": 76.5,
      "skillGaps": [
        {
          "skillId": "skill-object-id",
          "gap": 3,
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
  "predictedPlacementRate": 0.765,
  "topSkillGaps": [
    "skill-object-id"
  ],
  "note": "Deterministic readiness heuristic; replace with a trained model when historical placement outcomes are available."
}
```

Node must enforce institution/cohort access before sending data to Python.

---

## 4. Resume / Document Parsing

### Python: `POST /resume-parse`

The current parser is a lightweight baseline keyword extractor. Node remains
responsible for resolving extracted names against the authoritative Skill
taxonomy.

Request:

```json
{
  "documentText": "Experienced Python developer with Docker and MongoDB..."
}
```

Response:

```json
{
  "extractedSkillNames": [
    "Python",
    "Docker",
    "MongoDB"
  ],
  "note": "Baseline keyword extraction. Node must resolve extracted names against the controlled Skill taxonomy before persistence."
}
```

Python must not create or modify Skill records.

---

## 5. Intelligent Matching

### Python: `POST /match`

Node obtains the authenticated student's active SkillProfile and currently
eligible IndustryOpportunity records from MongoDB.

Request:

```json
{
  "studentSkills": [
    {
      "skillId": "skill-object-id",
      "score": 8
    }
  ],
  "opportunities": [
    {
      "opportunityId": "industry-opportunity-object-id",
      "title": "Backend Developer Intern",
      "requiredSkills": [
        {
          "skillId": "skill-object-id",
          "minScore": 7,
          "required": true,
          "weight": 0.6
        }
      ]
    }
  ]
}
```

Response:

```json
{
  "matches": [
    {
      "opportunityId": "industry-opportunity-object-id",
      "title": "Backend Developer Intern",
      "matchScore": 87.5,
      "matchedSkills": [
        {
          "skillId": "skill-object-id",
          "currentScore": 8,
          "requiredScore": 7,
          "gap": 0
        }
      ],
      "missingRequiredSkillIds": []
    }
  ]
}
```

The current matching implementation is deterministic weighted skill attainment.
It does not automatically mutate `OpportunityShortlist` records. Persisting a
match score belongs to the controlled shortlist workflow.

---

## Node API routes

The Node predictive facade is exposed under `/api/insights`:

- `POST /api/insights/skill-gap`
- `POST /api/insights/placement`
- `POST /api/insights/growth-map-recommend`
- `POST /api/insights/resume-parse`
- `POST /api/insights/match`

Node controllers should validate request-level requirements, authenticate the
caller through the normal middleware, and delegate MongoDB assembly and
workflow-specific authorization to services.

## Controlled taxonomy rule

`Skill` IDs are the persisted contract. Project, training, academic,
experience, profile, opportunity, profile-derived predictive payloads, and
Python payloads should use Skill IDs whenever the authoritative record already
exists.

Free text is a UI/input convenience only and must be resolved before storage.
Python may return extracted skill names for NLP workflows, but Node must resolve
them against the controlled Skill taxonomy before persistence.
