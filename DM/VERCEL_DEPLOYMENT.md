# Vercel account storage

Account records and sign-in sessions are stored in Neon Postgres when `DATABASE_URL` is configured. The required tables are created automatically on the first account request.

1. Create a Neon Postgres database, either through the Neon integration in the Vercel Marketplace or at neon.tech.
2. In Vercel, open the project settings and add the database connection string as the `DATABASE_URL` environment variable. Enable it for each deployment environment you use.
3. Redeploy the project so the function receives the new environment variable.

Do not commit the connection string. Without `DATABASE_URL`, Vercel returns a clear service error for account requests. Local development without the variable uses temporary in-memory accounts; set `DATABASE_URL` locally when you want to test persistence.