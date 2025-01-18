# AVA IRIS

## Local Development Setup

### Prerequisites

1. **Node.js** - Version 18 or higher
2. **Docker Desktop** - Latest stable version
3. **Git** - Latest stable version
4. **Required API Keys/Credentials**:
   - Google OAuth credentials (for authentication and Gmail API)
   - OpenAI API key
   - Resend API key (for email services)

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

4. **Start Docker Services**
   ```bash
   # Start Supabase and PostgreSQL
   docker compose up -d
   ```

5. **Initialize Database**
   ```bash
   # Apply database migrations
   npx supabase db reset
   ```

6. **Start Development Server**
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

1. **Can't Connect to Database**
   - Ensure Docker is running
   - Check if ports 54321 and 54322 are available
   - Run `docker compose down && docker compose up -d` to restart services

2. **Prisma/Database Sync Issues**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Docker Container Issues**
   ```bash
   # Reset all containers and volumes
   docker compose down -v
   docker compose up -d
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
   DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
   SUPABASE_URL="http://localhost:54321"
   SUPABASE_ANON_KEY="[auto-generated-by-docker]"
   SUPABASE_SERVICE_ROLE_KEY="[auto-generated-by-docker]"
   ```

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
