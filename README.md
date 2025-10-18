# Cybersecurity Log Analysis Tool

A full-stack web application for uploading, parsing, and analyzing Apache access logs with AI-powered security insights and anomaly detection.

## 📹 Video Walkthrough

A video walkthrough demonstrating the application features and usage will be recorded separately.

## Features

- **User Authentication**: Secure login/signup with JWT tokens and bcrypt password hashing
- **File Upload**: Upload Apache access log files (.txt, .log) with validation up to 10MB
- **Log Parsing**: Automatic parsing of Apache access log format with detailed field extraction
- **Advanced Anomaly Detection**: Rule-based detection with severity levels (Low/Medium/High/Critical) and confidence scores
- **🤖 AI-Powered Analysis**: OpenAI GPT-5-nano integration for advanced threat detection and SOC insights with Markdown support
- **Data Visualization**: Interactive timeline charts, expandable data views, and analysis summaries
- **Database Storage**: PostgreSQL with Prisma ORM for persistent data and user management
- **Security Features**: Rate limiting, JWT middleware protection, file validation, and secure API endpoints
- **Responsive UI**: Modern interface built with Next.js, Tailwind CSS, and react-hot-toast notifications
- **Deployment Ready**: Vercel deployment with health check endpoint and Docker support

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Axios, Recharts, ReactMarkdown, react-hot-toast
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcryptjs password hashing
- **AI**: OpenAI GPT-5-nano for advanced log analysis with Markdown support
- **Security**: Rate limiting, file validation, JWT middleware protection
- **Development**: ESLint, tsx for TypeScript execution
- **Deployment**: Vercel with Docker support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted)
- OpenAI API key (optional, for AI analysis - enables GPT-5-nano features)
- Git for version control

### Local Setup

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp environment.txt .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/anomaly_detection"

   # JWT Secret for authentication
   JWT_SECRET="your-super-secure-jwt-secret-here"

   # OpenAI API Key (optional)
   OPENAI_API_KEY="your-openai-api-key-here"
   ```

   **Note:** For development, you can use simple values. For production, generate a secure JWT secret with `openssl rand -base64 32`.

3. **Set up the database:**

   Follow the detailed database setup instructions in `DATABASE_SETUP.md`, or use these quick commands:

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev

   # Seed database with test users and sample data
   npx prisma db seed
   ```

   **Note:** The database will be seeded with test accounts and sample log analysis data.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Create an account or log in (use seeded accounts: admin/admin123, analyst/analyst123, testuser/testpass123)
   - Upload Apache access log files for analysis

### Database Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name migration_name

# View database in browser
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database with test data
npx prisma db seed
```

### Test Accounts

The database is seeded with these test accounts:

- **admin** / **admin123** - Administrator account
- **analyst** / **analyst123** - Analyst account
- **testuser** / **testpass123** - Regular user account

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── signup/route.ts
│   │   ├── upload/route.ts
│   │   ├── results/route.ts
│   │   └── health/route.ts
│   ├── login/page.tsx
│   ├── upload/page.tsx
│   ├── results/page.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts
│   ├── logParser.ts
│   ├── middleware.ts
│   └── rateLimit.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── components/
├── globals.css
└── layout.tsx
├── DATABASE_SETUP.md
├── README.md
├── SPEC.md
├── environment.txt
├── next.config.ts
├── package.json
├── vercel.json
└── tailwind.config.js
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration (rate limited: 5 attempts/15min)
- `POST /api/auth/login` - User login (rate limited: 5 attempts/15min)

### File Operations

- `POST /api/upload` - Upload and analyze log files (requires auth, rate limited: 10 uploads/min)
- `GET /api/results` - Fetch user's analysis results (requires auth)

### System

- `GET /api/health` - Health check endpoint (no auth required)

### Security Features

- **JWT Authentication**: All endpoints except `/api/health` require valid JWT tokens
- **Rate Limiting**: Authentication endpoints (5/15min), Upload endpoint (10/min)
- **File Validation**: Uploads restricted to `.txt` and `.log` files, max 10MB
- **Input Sanitization**: All inputs validated and sanitized

## Log Format

The application parses Apache access logs in the standard format:

```
%h %l %u %t "%r" %>s %b
```

Example:

```
127.0.0.1 - - [10/Oct/2025:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326
```

## 🔍 Anomaly Detection

The application implements comprehensive rule-based anomaly detection with severity levels and confidence scores:

### Detection Rules

- **High Volume IP Detection**: Flags IPs with excessive requests (>10% of total traffic or >50 requests)
- **Time Window Anomalies**: Detects IPs making >50 requests within 5-minute windows
- **High Error Rate Detection**: Identifies traffic with >5% error responses (4xx/5xx)
- **Unusual HTTP Methods**: Flags non-standard HTTP methods (anything other than GET, POST, HEAD)
- **Suspicious URL Patterns**: Detects path traversal, injection attempts, and admin probes
- **Rapid-Fire Requests**: Identifies potential DoS attacks with burst traffic patterns

### Severity Levels

- **Low**: Minor anomalies requiring monitoring
- **Medium**: Moderate security concerns needing attention
- **High**: Significant threats requiring immediate investigation
- **Critical**: Severe security incidents demanding urgent response

### Frontend Visualization

- Anomalous log entries highlighted in red with severity indicators
- Confidence scores and detailed explanations in tooltips
- Expandable anomaly summary with categorized findings
- Timeline charts showing traffic patterns and anomaly spikes

## 🤖 AI-Powered Security Analysis

**OpenAI GPT-5-nano used for threat detection and summarization in the analysis step, with prompts focused on SOC insights and Markdown-formatted reports.**

The application integrates OpenAI's GPT-5-nano model for advanced security analysis of Apache access logs. This AI-powered analysis complements the rule-based anomaly detection by providing:

### AI Analysis Features

- **Threat Assessment**: Identifies potential security threats, attack patterns, and malicious activities
- **Traffic Analysis**: Analyzes normal vs. abnormal traffic patterns with contextual insights
- **Timeline Summarization**: Provides narrative summaries of activity over time
- **Risk Level Assignment**: Assigns overall risk levels (Low/Medium/High/Critical)
- **Actionable Recommendations**: Provides SOC-specific security recommendations
- **Anomaly Evaluation**: Assesses the severity and context of detected anomalies
- **Markdown Support**: AI insights rendered with rich formatting for better readability

### AI Analysis Process

1. **Data Preparation**: Log entries are formatted with timestamps, IPs, methods, URLs, and status codes
2. **Statistical Context**: AI receives comprehensive statistics including traffic patterns, error rates, and anomaly data
3. **Security Analysis**: GPT model analyzes patterns for indicators of attacks, reconnaissance, and data exfiltration
4. **Report Generation**: Produces detailed security analysis with specific findings and recommendations

### Configuration

Set the `OPENAI_API_KEY` environment variable to enable AI analysis. Without the API key, the application falls back to rule-based anomaly detection only.

### AI Analysis Documentation

The AI integration is clearly documented in code comments indicating where AI is used for threat detection and summarization, ensuring transparency about AI usage in the security analysis pipeline.

## Sample Data

Sample Apache access log files are provided in the `examples/` directory:

- `sample_access.log` - Basic access patterns with some admin probes
- `suspicious_activity.log` - Contains brute force login attempts and reconnaissance
- `normal_traffic.log` - Legitimate user traffic with various browsers and devices
- `advanced_attacks.log` - Sophisticated attacks including SQL injection, path traversal, and credential stuffing
- `mixed_traffic.log` - Combination of normal traffic mixed with security threats

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
npm start
```

### Docker Deployment

This project is designed to work with Docker. For production deployment:

1. Build the Docker image
2. Set environment variables in your container
3. Run database migrations in the container
4. Start the application

## Security Considerations

- **Authentication**: JWT tokens with bcryptjs password hashing
- **Authorization**: All API endpoints protected with JWT middleware except health checks
- **Rate Limiting**: Authentication (5/15min), Upload operations (10/min) to prevent abuse
- **File Security**: Upload validation restricts to `.txt` and `.log` files, max 10MB size limit
- **Input Validation**: All inputs sanitized and validated on both client and server
- **Database Security**: Parameterized queries via Prisma ORM
- **Error Handling**: Secure error messages that don't leak sensitive information
- **HTTPS Ready**: Designed for secure deployment with proper headers and certificates

## 🚀 Deployment to Vercel

### Prerequisites

- Vercel account (free at vercel.com)
- GitHub repository

### Deployment Steps

1. **Connect Repository:**

   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository

2. **Configure Build Settings:**

   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (leave default)

3. **Set Environment Variables:**
   In Vercel dashboard → Project Settings → Environment Variables:

   ```
   JWT_SECRET=your-super-secure-jwt-secret-here
   OPENAI_API_KEY=your-openai-api-key-here  # Optional
   ```

   Generate a secure JWT secret:

   ```bash
   openssl rand -base64 32
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build completion
   - Visit your deployed URL

### Troubleshooting Vercel Deployment

**404 Error on Root Route:**

- **Fixed**: The home page now shows a static landing page with a "Get Started" link
- The previous issue was caused by immediate client-side redirects before localStorage was available
- Direct access to `/` now shows a proper landing page

**API Routes Not Working:**

- Check environment variables are set in Vercel dashboard
- Verify API routes are in `src/app/api/` directory
- Ensure JWT_SECRET is properly configured for authentication endpoints

**Build Failures:**

- Ensure all dependencies are in `package.json`
- Check TypeScript compilation errors with `npm run build`
- Verify Next.js configuration in `next.config.ts` and `vercel.json`

**Database Issues:**

- For production, use a hosted PostgreSQL service (Neon, Supabase, etc.)
- Set `DATABASE_URL` environment variable in Vercel
- Run database migrations in production using Prisma commands

### Health Check

Test your deployment with the health check endpoint:

```
GET https://your-app.vercel.app/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-18T...",
  "environment": "production",
  "version": "1.0.0",
  "config": {
    "jwtSecretConfigured": true,
    "openAiKeyConfigured": true
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Key Files Overview

- **`src/lib/logParser.ts`**: Core log parsing and anomaly detection logic
- **`src/lib/auth.ts`**: JWT token verification utilities
- **`src/lib/middleware.ts`**: File validation and upload security
- **`src/lib/rateLimit.ts`**: Rate limiting implementation for API protection
- **`src/prisma/schema.prisma`**: Database schema definition
- **`src/prisma/seed.ts`**: Database seeding with test data
- **`DATABASE_SETUP.md`**: Detailed PostgreSQL setup instructions
- **`environment.txt`**: Environment variables template
- **`vercel.json`**: Vercel deployment configuration
- **`next.config.ts`**: Next.js build configuration

## Development Workflow

1. **Setup**: Follow Quick Start guide
2. **Development**: Use `npm run dev` for local development
3. **Database**: Use Prisma commands for schema changes and migrations
4. **Testing**: Upload sample log files to test parsing and analysis
5. **Deployment**: Deploy to Vercel with proper environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
