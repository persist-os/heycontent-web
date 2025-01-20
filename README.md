# AVA IRIS

## Local Development Setup

### Prerequisites

1. **Node.js** - Version 18 or higher
2. **Docker Setup**:
   - Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Create a free [Docker Hub](https://hub.docker.com/signup) account
   - After installation, run `docker login` in your terminal
3. **Git** - Latest stable version
4. **Required API Keys/Credentials**:
   - Google OAuth credentials (for authentication and Gmail API)
   - OpenAI API key
   - Resend API key (for email services)

### Docker Setup Guide

1. **Install Docker Desktop**:
   - Download and install from [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Start Docker Desktop application
   - Verify installation:
     ```bash
     docker --version
     docker compose --version
     ```

2. **Supabase Local Development**:
   - Our Docker setup includes a local Supabase instance
   - No Supabase account required for local development
   - Everyone gets the same setup through Docker + Prisma migrations
   - Access Supabase Studio at http://localhost:54323
   - Default credentials:
     ```
     Email: admin@admin.com
     Password: admin
     ```
   - The following services are included:
     * PostgreSQL Database (port 54322)
     * Supabase API (port 54321)
     * Supabase Studio (port 54323)
   - Database credentials:
     ```
     Host: localhost
     Port: 54322
     Database: postgres
     User: postgres
     Password: postgres
     ```
   - Database schema and structure are managed through Prisma:
     * All tables and relationships are defined in `prisma/schema.prisma`
     * Migrations are tracked in `prisma/migrations`
     * Everyone gets the same database structure by running migrations

3. **Configure Docker Resources**:
   - Open Docker Desktop
   - Go to Settings/Preferences
   - Recommended settings:
     * CPUs: At least 2
     * Memory: At least 4GB
     * Swap: At least 1GB
     * Disk image size: At least 60GB

4. **Port Requirements**:
   Ensure these ports are available on your machine:
   - 3000: Next.js application
   - 54321: Supabase API
   - 54322: Supabase Database
   - 54323: Supabase Studio

5. **Start Docker Services**:
   ```bash
   # Start all services
   docker compose up -d

   # Verify services are running
   docker compose ps

   # View logs if needed
   docker compose logs -f
   ```

6. **Common Docker Commands**:
   ```bash
   # Stop all services
   docker compose down

   # Restart services
   docker compose restart

   # Reset everything (including data)
   docker compose down -v
   docker compose up -d

   # View container status
   docker compose ps

   # View logs for specific service
   docker compose logs supabase -f
   ```

7. **Troubleshooting Docker**:
   - If services won't start:
     ```bash
     # Remove all containers and volumes
     docker compose down -v
     # Remove all images
     docker compose down --rmi all
     # Start fresh
     docker compose up -d
     ```
   - If ports are in use:
     * Stop any existing PostgreSQL services
     * Check for other Docker containers using same ports
     * Use `lsof -i :[port]` to find processes using ports

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone [repository-url]
   cd ava-iris
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration. You'll need to set up:
   - Database connection (automatically configured with Docker)
   - Supabase configuration (automatically configured with Docker)
   - Google OAuth credentials (from Google Cloud Console)
   - OpenAI API key (from OpenAI dashboard)
   - Resend API key (for email services)
   - NextAuth secret (generate a random string of at least 32 characters)

   View [.env.example](./.env.example) for all required variables with descriptions.

4. **Initialize Database**
   ```bash
   # Apply database migrations
   npx supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Verification Steps

1. Open [http://localhost:3000](http://localhost:3000) - Main application
2. Open [http://localhost:54323](http://localhost:54323) - Supabase Studio
3. Verify database connection by signing up a new user

### Common Issues and Solutions

1. **Docker Issues**:
   - "Port already in use":
     * Check running services: `lsof -i :[port]`
     * Stop conflicting services or change ports in docker-compose.yml
   - "No space left on device":
     * Clean up unused Docker resources: `docker system prune`
     * Increase Docker disk image size in Docker Desktop settings
   - "Connection refused":
     * Ensure Docker Desktop is running
     * Check service logs: `docker compose logs [service]`
     * Restart services: `docker compose restart`

2. **Database Issues**:
   ```bash
   # Reset database
   docker compose down -v
   docker compose up -d
   npx prisma db push
   ```

### Development Workflow

1. Always start Docker before development:
   ```bash
   docker compose up -d
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. When finished, you can stop Docker:
   ```bash
   docker compose down
   ```

### Environment Variables

Required environment variables for local development are listed in [.env.example](./.env.example). Here's how to obtain each credential:

1. **Database & Supabase** (automatically configured with Docker)
   ```env
   # These are default local development values - no need to change
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   SUPABASE_URL="http://localhost:54321"
   SUPABASE_ANON_KEY="[auto-generated-by-docker]"
   SUPABASE_SERVICE_ROLE_KEY="[auto-generated-by-docker]"
   ```
   - These values are automatically set up by Docker
   - The keys will be available in Supabase Studio after starting Docker
   - You can find them in Supabase Studio (http://localhost:54323) under Project Settings > API
   - No Supabase account or project needed

2. **Google OAuth** (from [Google Cloud Console](https://console.cloud.google.com))
   - Create a new project
   - Enable Gmail API
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials
   ```env
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

3. **OpenAI** (from [OpenAI Dashboard](https://platform.openai.com/api-keys))
   - Create an account
   - Generate an API key
   ```env
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Email Service** (from [Resend.com](https://resend.com))
   - Sign up for an account
   - Generate API key
   ```env
   RESEND_API_KEY="your-resend-api-key"
   ```

5. **Next Auth & Application URLs**
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   # Generate a random string (min 32 chars) for NEXTAUTH_SECRET
   NEXTAUTH_SECRET="your-nextauth-secret-at-least-32-chars"
   ```

6. **Feature Flags**
   ```env
   NODE_ENV="development"
   ```

### Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Cloud Console](https://console.cloud.google.com)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Resend Documentation](https://resend.com/docs)

### Need Help?

If you encounter any issues not covered here:
1. Check the error logs in Docker Desktop
2. Check the terminal output for the Next.js development server
3. Contact the team lead for additional support

### Database Setup & Synchronization

1. **Initial Database Setup**:
   ```bash
   # Start Docker services first
   docker compose up -d
   
   # Apply all migrations
   npx prisma migrate deploy
   
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   ```

2. **Database Reset** (if needed):
   ```bash
   # Remove all data and apply migrations fresh
   npx prisma migrate reset --force
   
   # Or using Docker (complete reset)
   docker compose down -v
   docker compose up -d
   npx prisma migrate deploy
   ```

3. **Verify Database Structure**:
   - Open Supabase Studio at http://localhost:54323
   - Go to Table Editor to verify tables
   - Expected tables:
     * users
     * accounts
     * sessions
     * conversations
     * messages
     * (other project tables...)

4. **Sync with Team Changes**:
   ```bash
   # When new migrations are added by team
   git pull
   npx prisma migrate deploy
   
   # If schema is updated without migrations
   npx prisma db push
   ```

5. **Common Database Operations**:
   ```bash
   # View database tables
   npx prisma studio
   
   # Reset single table
   npx prisma db reset --preview-feature
   
   # Check migration status
   npx prisma migrate status
   ```
