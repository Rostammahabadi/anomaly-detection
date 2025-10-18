# Cybersecurity Log Analysis Tool

A full-stack web application for uploading, parsing, and analyzing Apache access logs with AI-powered security insights and anomaly detection.

## Features

- **User Authentication**: Secure login/signup with JWT tokens
- **File Upload**: Upload Apache access log files (.txt, .log) up to 10MB
- **Log Parsing**: Automatic parsing of Apache access log format
- **Anomaly Detection**: Rule-based detection of suspicious patterns
- **🤖 AI-Powered Analysis**: OpenAI GPT integration for advanced threat detection and SOC insights
- **Data Visualization**: Timeline charts and analysis summaries
- **Database Storage**: PostgreSQL with Prisma ORM for persistent data
- **Responsive UI**: Modern interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Axios, Recharts
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **AI**: OpenAI GPT-4o for advanced log analysis
- **Deployment**: Docker-ready for containerized deployment

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key (optional, for AI analysis)

### Local Setup

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/anomaly_detection"
   JWT_SECRET="your-jwt-secret-key-here"
   OPENAI_API_KEY="your-openai-api-key-here"
   ```

3. **Set up the database:**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev
   ```

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
│   │   └── results/route.ts
│   ├── login/page.tsx
│   ├── upload/page.tsx
│   ├── results/page.tsx
│   └── page.tsx
├── components/
├── lib/
│   ├── auth.ts
│   └── logParser.ts
└── prisma/
    └── schema.prisma
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### File Operations

- `POST /api/upload` - Upload and analyze log files (requires auth)
- `GET /api/results` - Fetch user's analysis results (requires auth)

## Log Format

The application parses Apache access logs in the standard format:

```
%h %l %u %t "%r" %>s %b
```

Example:

```
127.0.0.1 - - [10/Oct/2025:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326
```

## 🤖 AI-Powered Security Analysis

The application integrates OpenAI's GPT-4o model for advanced security analysis of Apache access logs. This AI-powered analysis complements the rule-based anomaly detection by providing:

### AI Analysis Features

- **Threat Assessment**: Identifies potential security threats, attack patterns, and malicious activities
- **Traffic Analysis**: Analyzes normal vs. abnormal traffic patterns with contextual insights
- **Timeline Summarization**: Provides narrative summaries of activity over time
- **Risk Level Assignment**: Assigns overall risk levels (Low/Medium/High/Critical)
- **Actionable Recommendations**: Provides SOC-specific security recommendations
- **Anomaly Evaluation**: Assesses the severity and context of detected anomalies

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

- `sample_access.log` - Basic access patterns
- `suspicious_activity.log` - Contains potential security anomalies

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

- JWT tokens are used for authentication
- Passwords are hashed with bcrypt
- File uploads are validated for type and size
- API endpoints require authentication
- Database queries are parameterized

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

- The home page redirects to `/login` automatically
- Direct access to `/` shows a landing page

**API Routes Not Working:**

- Check environment variables are set in Vercel
- Verify API routes are in `src/app/api/` directory

**Build Failures:**

- Ensure all dependencies are in `package.json`
- Check TypeScript compilation errors

**Database Issues:**

- For production, use a hosted PostgreSQL service
- Set `DATABASE_URL` environment variable in Vercel

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

## License

This project is licensed under the MIT License.
