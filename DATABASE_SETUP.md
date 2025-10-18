# Database Setup Guide

## PostgreSQL Installation & Setup

### macOS (with Homebrew)

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb anomaly_detection

# Set up user (optional - uses default postgres user)
psql -d anomaly_detection -c "CREATE USER IF NOT EXISTS postgres WITH PASSWORD 'password';"
psql -d anomaly_detection -c "GRANT ALL PRIVILEGES ON DATABASE anomaly_detection TO postgres;"
```

### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb anomaly_detection

# Set up user
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE anomaly_detection TO postgres;"
```

### Windows

1. Download PostgreSQL from https://www.postgresql.org/download/
2. Run installer and follow setup wizard
3. Create database using pgAdmin or command line:
   ```sql
   CREATE DATABASE anomaly_detection;
   CREATE USER postgres WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE anomaly_detection TO postgres;
   ```

### Docker (Alternative)

```bash
# Run PostgreSQL in Docker
docker run --name postgres-anomaly -e POSTGRES_PASSWORD=password -e POSTGRES_DB=anomaly_detection -p 5432:5432 -d postgres:15

# Connect to container (if needed)
docker exec -it postgres-anomaly psql -U postgres -d anomaly_detection
```

## Prisma Setup

After PostgreSQL is running:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database with test data
npx prisma db seed

# View database (optional)
npx prisma studio
```

## Environment Configuration

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/anomaly_detection"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
OPENAI_API_KEY="your-openai-api-key-optional"
```

## Test Accounts

After seeding, you can login with:

- **admin** / **admin123**
- **analyst** / **analyst123**
- **testuser** / **testpass123**

## Troubleshooting

### Connection Issues

- Ensure PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check database exists: `psql -l`
- Verify credentials in `.env` file

### Migration Issues

- Reset database: `npx prisma migrate reset`
- Clean start: `npx prisma migrate dev --name init`

### Permission Issues

- Grant permissions: `GRANT ALL PRIVILEGES ON DATABASE anomaly_detection TO postgres;`
- Check user exists: `SELECT * FROM pg_user WHERE usename = 'postgres';`
