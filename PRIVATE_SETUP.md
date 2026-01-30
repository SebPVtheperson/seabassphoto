# Galleries Setup (Supabase + Netlify)

Galleries are stored in **Supabase**. Public galleries appear on the homepage; private galleries require a codeword.

## Flow

- **Public galleries**: Fetched from Supabase, linked from the homepage
- **Private galleries**: User enters codeword → Netlify validates against Supabase → user sees their galleries

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the table SQL from the setup instructions (see schema in docs)
3. Run `SUPABASE_SEED.sql` in the Supabase SQL Editor to add the Ice Ride gallery
4. Get your **Project URL** and **service_role** (or secret) key from Project Settings → API

## 2. Netlify Setup

1. Deploy to [Netlify](https://app.netlify.com) (connect your repo)
2. Add environment variables:
   - `SUPABASE_URL` – your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` – your Supabase service role or secret key
3. Redeploy

## 3. Add Galleries in Supabase

Use the Supabase Table Editor or SQL:

```sql
-- Public gallery
INSERT INTO galleries (slug, title, is_public, images)
VALUES ('my-gallery', 'My Gallery', true, '["https://..."]'::jsonb);

-- Private gallery (requires codeword)
INSERT INTO galleries (slug, title, is_public, codeword, images)
VALUES ('private-event', 'Private Event', false, 'secretcode', '["https://..."]'::jsonb);
```

## 4. Local Testing

```bash
npm install
netlify dev
```

Create a `.env` file (do not commit):

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Fallback

If the API is unavailable, the homepage falls back to the static `2-23-25-ice-ride.html` link.
