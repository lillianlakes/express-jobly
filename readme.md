# Jobly Backend

A full-stack job search API with **AI-powered recommendations**, authentication, job applications, and profile management.

This project originally began as part of <a href="https://www.rithmschool.com/">Rithm School's</a> curriculum. Since completion, it has been significantly expanded with AI-powered job recommendations, improved database architecture, and production-ready features.

## Tech Stack

- **Node.js** with Express.js
- **PostgreSQL** (hosted on Supabase with session pooler)
- **JWT** authentication with bcrypt
- **JSONSchema** validation
- Deterministic recommendation engine (zero external AI API costs)

## Original Project Scope (Rithm School)

- User authentication (login, signup, JWT tokens)
- Company and job management (CRUD operations)
- Job search with filtering (salary, equity, title)
- Job applications tracking
- User profile management
- Admin-only operations and middleware

## Enhancements Added Beyond Rithm Requirements

### 🤖 **AI-Powered Recommendations**

- New `GET /ai/recommendations/:username` endpoint
- Free recommendation engine using only internal data (no paid LLM APIs)
- Scoring based on:
  - Profile token overlap with job titles/companies
  - Salary alignment with application history
  - Equity preferences
  - Company affinity from past applications
- Score normalized to **0–100 integer scale** for consistent frontend display
- Explainable "Why it matches" reasons for each recommendation

### 🏗️ **Database & Infrastructure**

- Migrated from Render's expiring Postgres to **Supabase free tier** (indefinite)
- Implemented schema qualification for session pooler compatibility
- Explicit `public.` table prefixes for production reliability
- Improved connection initialization with proper async/await handling

### 🔒 **Code Quality & Testing**

- Comprehensive route and model test suites
- Auth validation tests (admin guards, user isolation)
- Recommendation score range assertions (0–100 guarantee)
- Error handling middleware with detailed logging

## Getting Started

### Run the server

```bash
node server.js
```

### Run tests

```bash
jest -i
```

### Environment Variables

Create a `.env` file with:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your_jwt_secret
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Authentication

- `POST /auth/register` – Create new user account
- `POST /auth/token` – Login and get JWT token

### Users

- `GET /users` – List all users (admin only)
- `GET /users/:username` – Get user profile + applications
- `PATCH /users/:username` – Update user profile
- `DELETE /users/:username` – Delete user account
- `POST /users/:username/jobs/:id` – Apply for a job

### Companies

- `GET /companies` – Search companies with filters
- `GET /companies/:handle` – Get company details + jobs
- `POST /companies` – Create company (admin only)
- `PATCH /companies/:handle` – Update company (admin only)
- `DELETE /companies/:handle` – Delete company (admin only)

### Jobs

- `GET /jobs` – Search jobs with filters
- `GET /jobs/:id` – Get job details
- `POST /jobs` – Create job (admin only)
- `PATCH /jobs/:id` – Update job (admin only)
- `DELETE /jobs/:id` – Delete job (admin only)

### 🤖 AI Recommendations (Free, No External APIs)

- `GET /ai/recommendations/:username?limit=10` – Get personalized job recommendations
  - Auth required: logged-in user or admin
  - Query params: `limit` (1–50, default 10)
  - Response: `{ recommendations: [...], meta: { totalCandidates, returned } }`
  - Each recommendation includes score (0–100) and reasons array

## Response Examples

### AI Recommendation

```json
{
  "recommendations": [
    {
      "id": 42,
      "title": "Senior Developer",
      "companyHandle": "acme-corp",
      "salary": 150000,
      "equity": 0.05,
      "score": 87,
      "reasons": [
        "Matches your interests: developer, senior",
        "Company aligns with your past applications",
        "Salary aligns with your application history",
        "Includes equity"
      ]
    }
  ],
  "meta": {
    "totalCandidates": 197,
    "returned": 10
  }
}
```

## Notes

- All scores from `/ai/recommendations` are integers on 0–100 scale
- Recommendation engine is deterministic (no randomness), based purely on user history
- No external paid AI APIs—all logic runs locally on the backend
- Database uses explicit schema qualification for Supabase session pooler compatibility
