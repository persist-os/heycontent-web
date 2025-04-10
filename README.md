# HeyContent

A modern content management platform built with Next.js, Convex, and Google OAuth.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Convex
- **Authentication**: Google OAuth
- **AI Integration**: OpenAI, LangChain
- **Email**: Resend
- **Testing**: Jest
- **State Management**: Zustand

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Cloud Platform account (for OAuth)
- OpenAI API key
- Convex account

## Getting Started

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd heycontent
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables:
     - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console
     - `OPENAI_API_KEY` from OpenAI dashboard
     - `RESEND_API_KEY` from Resend.com
     - `NEXTAUTH_SECRET` (generate a secure random string)
     - `CONVEX_URL` from your Convex deployment

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest tests in watch mode

## Project Structure

```
heycontent/
├── app/              # Next.js app directory
├── components/       # Reusable React components
├── convex/          # Convex backend functions
├── public/          # Static assets
├── src/             # Source files
├── types/           # TypeScript type definitions
└── scripts/         # Utility scripts
```

## Authentication

The application uses Google OAuth for authentication. To set up:

1. Create a project in Google Cloud Console
2. Enable the Google OAuth API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `[your-production-url]/api/auth/callback/google` (production)

## Database

The application uses Convex as the database. Make sure to:

1. Set up your Convex project
2. Configure the `CONVEX_URL` in your environment variables
3. Deploy your Convex functions using the Convex CLI

## Testing

The project uses Jest for testing. Run tests with:

```bash
npm run test
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and ensure they pass
4. Submit a pull request

## Environment Variables

Required environment variables are documented in `.env.example`. Make sure to set up all required variables before running the application.

## Deployment

The application can be deployed to any platform that supports Next.js applications. Make sure to:

1. Set up all required environment variables
2. Build the application with `npm run build`
3. Start the production server with `npm run start`

## Support

For support, please contact the development team or create an issue in the repository.
