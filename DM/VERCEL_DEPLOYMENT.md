# Vercel deployment

## Optional accounts

Browsing and guest checkout work without an account. To enable real account creation and sign-in, create a Neon Postgres database and set its connection string as `DATABASE_URL` in Vercel for the deployment environment. The account tables are created automatically. Redeploy after setting the variable. Do not commit the connection string.

## Search Console

Set `PUBLIC_SITE_URL` in Vercel to the canonical production origin, for example `https://www.example.com`, then redeploy. After deployment, verify that `/robots.txt` points to the production sitemap and that `/sitemap.xml` contains the production homepage URL. Submit `https://www.example.com/sitemap.xml` in Google Search Console and request indexing for the homepage. Replace the example host with the site's actual domain.