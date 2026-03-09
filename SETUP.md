# 📅 Community Calendar — Setup Guide

A shared community event calendar built with Next.js + Supabase.
Anyone with the link can submit events and see the live calendar.

---

## ✅ STEP 1 — Create a free Supabase account & project

1. Go to https://supabase.com and click **Start your project** (free)
2. Sign up and click **New Project**
3. Give it a name like `community-calendar`
4. Set a database password (save it somewhere safe)
5. Choose the region closest to you → click **Create new project**
6. Wait ~1 minute for it to set up

---

## ✅ STEP 2 — Create the events table

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste in the following SQL and click **Run**:

```sql
create table events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  date date not null,
  place text not null,
  time text not null,
  description text not null,
  created_at timestamp with time zone default now()
);

-- Allow anyone to read and insert events (no login required)
alter table events enable row level security;

create policy "Anyone can view events"
  on events for select
  using (true);

create policy "Anyone can add events"
  on events for insert
  with check (true);
```

You should see a green "Success" message.

---

## ✅ STEP 3 — Get your Supabase credentials

1. In your Supabase dashboard, click **Settings** (gear icon) → **API**
2. Copy two values:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

---

## ✅ STEP 4 — Deploy to Vercel

1. Go to https://github.com and create a free account
2. Create a **new repository** called `community-calendar`
3. Upload all the files from this zip (drag and drop into GitHub)
4. Go to https://vercel.com → sign up free → click **Add New Project**
5. Import your GitHub repository
6. Before clicking Deploy, click **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL from Step 3 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key from Step 3 |

7. Click **Deploy** — your app will be live in ~60 seconds! 🎉

---

## 🌐 Sharing your calendar

Once deployed, Vercel gives you a URL like:
`https://community-calendar-abc123.vercel.app`

Share this link with anyone — they can:
- Browse the calendar by month
- Click any day with events to see details
- Submit new events via the **Add Event** form

All submitted events are stored in Supabase and visible to **everyone** in real time.

---

## 💡 Tips

- **Real-time updates**: The calendar automatically refreshes when anyone submits an event — no page reload needed.
- **Free tier**: Supabase's free plan supports up to 50,000 database rows and 500MB storage — more than enough for a community calendar.
- **Custom domain**: In Vercel's dashboard you can add your own domain name (e.g. `events.yourtown.com`) under Project → Settings → Domains.
