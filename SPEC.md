Full-Stack Cybersecurity Application Specification
Project Overview
Objective
Develop a full-stack web application that enables users to upload log files (using Apache access logs as the chosen format for this implementation), parse them, and present the parsed information in a user-friendly, human-consumable format. Key features include displaying insights relevant to a Security Operations Center (SOC) analyst, such as a summarized timeline of events. The application must incorporate basic authentication for security and provide an intuitive interface for file uploads and result viewing.
Ground Rules

Use AI (e.g., Cursor or similar tools) to assist in development, but ensure all code is understandable and explainable.
Prioritize functionality over production-readiness (e.g., no need for advanced error handling, scalability, or comprehensive testing).
Focus on a functional prototype; expected time commitment is 6-8 hours.

Chosen Log Format

Apache access logs (e.g., lines formatted as: 127.0.0.1 - - [10/Oct/2025:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326).
Parse fields: IP address, timestamp, request method, URL, HTTP status, response size.

Bonus Features

Implement anomaly detection to identify unusual patterns (e.g., high request volume from a single IP in a short timeframe).
Highlight anomalous entries in the UI.
Provide explanations for anomalies (e.g., "Unusual number of requests from a single IP in a short time frame").
Include a confidence score for each detected anomaly (e.g., 80% based on deviation from norms).

Requirements Breakdown
Frontend

Framework: Use TypeScript with Next.js (for integrated full-stack capabilities, including API routes).
Features:

Basic authentication: Login page with username/password form.
Protected routes: Upload and results pages accessible only after login.
File upload interface: Allow uploading .txt or .log files (max 10MB).
Results display: Show parsed logs in a table (columns: IP, Timestamp, Method, URL, Status, Size). Include expandable sections for AI-generated learnings, summarized timeline (e.g., event counts grouped by hour), and a simple chart (using Recharts for timeline visualization).
Responsive design: Ensure usability on desktop and mobile.

Dependencies: Install React, Next.js, Axios (for API calls), Recharts (for charts), and any UI libraries like Tailwind CSS for styling.
Authentication: Use JWT tokens stored in localStorage; validate on protected pages.

Backend

Framework: Use Next.js API routes (Node.js/Express-like) for simplicity in a monolithic full-stack setup.
API Endpoints (RESTful):

/api/auth/login: POST for user login (accept username/password, return JWT).
/api/auth/signup: POST for user registration (optional, but include for completeness).
/api/upload: POST for file upload (multipart/form-data), authenticate via JWT, parse logs, run analysis, store results.
/api/results: GET to fetch user's analyzed logs (authenticate, return list with metadata and analysis).

File Handling: Temporarily store uploaded files, parse them immediately, then delete or store minimally.
Parsing Logic: Extract log fields using regex or string splitting. Generate summarized timeline (e.g., group events by time intervals and count occurrences).
Security: Validate file types and sizes. Protect all endpoints except login with JWT middleware.
Error Handling: Basic (e.g., return JSON errors like { error: "Invalid file type" }).

AI Integration

Usage: Leverage OpenAI's GPT model (via API) for advanced analysis.

In the /api/upload endpoint, after parsing, send batched parsed logs to OpenAI with a prompt like: "Analyze these Apache access logs for key SOC analyst learnings, including potential threats, unusual patterns, and a summarized timeline of events."
For bonus anomaly detection: Include in the prompt to identify anomalies, explanations, and confidence scores. Supplement with rule-based detection (e.g., flag IPs with >50 requests in 5 minutes).

Documentation: In code comments and README.md, clearly note where AI is used (e.g., // AI Integration: Sending parsed logs to OpenAI for threat detection and summarization).
Dependencies: Install OpenAI SDK; require OPENAI_API_KEY in .env.
Fallback: If AI fails, provide basic parsed output without insights.

Database

Choice: PostgreSQL for storing users and log metadata/analysis results.
ORM: Use Prisma for schema management and queries.
Schema:

Users: id (primary key), username (unique), password_hash (use bcrypt for hashing).
Logs: id (primary key), user_id (foreign key), filename, upload_date, parsed_data (JSON), analysis_result (JSON including AI learnings, timeline, anomalies).

Setup: Include Prisma schema file, migrations, and seed script for test users.

Deployment

Local Setup:

Clone repo, install dependencies (npm install).
Set up .env with DATABASE_URL, JWT_SECRET, OPENAI_API_KEY.
Run Prisma migrations (npx prisma migrate dev).
Start app (npm run dev).

Bonus Cloud Deployment:

Deploy to Vercel (integrates seamlessly with Next.js).
Set environment variables in Vercel dashboard.
Provide live demo link in README.md.

Bonus Implementation Details

Anomaly Detection:

Rule-based: Calculate request frequencies per IP/time window; flag if exceeds threshold.
AI-enhanced: Prompt OpenAI to detect and explain anomalies.
UI: Highlight rows in red, add tooltips with explanation and confidence (e.g., "Confidence: 85% - High request volume").

Confidence Scoring: Simple calculation (e.g., (excess_requests / threshold) \* 100, capped at 100).

Deliverables

GitHub Repository:

Full source code (share with venkata@tenex.ai).
Structure: /pages, /api, /components, /prisma, /public (for examples), /examples (sample log files).

README.md:

Setup instructions (local and cloud).
AI explanation: "OpenAI GPT is used in the backend analysis step for threat detection, summarization, and anomaly identification via custom prompts focused on SOC insights."
Example log files: Include 2-3 sample Apache logs in /examples folder.
Video: Note that a walkthrough video will be recorded separately (e.g., 5-10 minutes explaining code structure, key features, and AI usage).
Optional: Live demo link (e.g., Vercel URL).

Testing:

Provide sample logs for upload testing.
Ensure end-to-end flow: Login → Upload → View results with parsing, AI insights, timeline, and anomalies.

Alignment with AI Development Tools (e.g., Cursor)

Use this spec as a reference to generate sequential prompts for building the app (e.g., "Implement the frontend login page based on the spec...").
Ensure prompts reference specific sections (e.g., "Follow the backend API endpoints as defined in spec.md").
Iterate by building components modularly: Init project → Auth → Database → Upload/Parsing → AI → UI → Deployment.
Validate against requirements: After each step, check for functionality, documentation of AI usage, and bonus features.
