# Bavly Badr Portfolio — v13

A fully publish-ready personal portfolio CMS built with vanilla HTML/CSS/JS + Supabase cloud backend.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Homepage with animated canvas background |
| `design.html` | Church design gallery with lightbox & skeletons |
| `video.html` | Video works — full-screen modal player |
| `violin.html` | Violin performances — full-screen music player with Canvas visualizer |
| `projects.html` | Software projects with PDF/link support |
| `competitions.html` | Competitions & initiatives |
| `blog.html` | Blog with rich-text post reader |
| `admin.html` | Admin CMS — **Google OAuth protected** |
| `shared.css` | Global design system |
| `shared.js` | Canvas, nav, reveal, lazy loading, utilities |
| `db.js` | Supabase REST layer + image compression + 30s cache |

---

## 🔐 Google Authentication Setup (REQUIRED before publishing)

The admin panel is protected by **Google OAuth** — only your Gmail address can sign in.
The old PIN system has been removed (it was visible in the page source — a security risk).

### Step 1 — Create a Google OAuth Client ID (~3 minutes)

1. Go to **https://console.cloud.google.com/**
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Choose **Web application**
6. Under **Authorised JavaScript origins**, add:
   - `https://yourdomain.com` (your live domain)
   - `http://localhost` (for local testing)
7. Click **Create** and copy the **Client ID** shown

### Step 2 — Paste it into admin.html

Open `admin.html` and find these two lines near the top of the script block:

```js
const ALLOWED_EMAIL    = 'bavlybadr61@gmail.com';  // Your Gmail
const GOOGLE_CLIENT_ID = 'PASTE_YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';
```

Replace the placeholder with your actual Client ID. That is all.

### How it works

- User clicks **Sign in with Google** → Google popup appears
- Google returns a token → the app fetches your email from Google's API
- If the email matches `ALLOWED_EMAIL`, a session is saved (8-hour TTL) and admin unlocks
- Wrong email → access denied with a clear message
- **Sign Out** in the sidebar clears the session and revokes the Google token
- No passwords stored anywhere. Google handles all authentication.

---

## 🚀 Before Publishing Checklist

1. Follow the Google Auth setup above and add your Client ID to admin.html
2. Add `ALLOWED_EMAIL` set to your Gmail address (already set to bavlybadr61@gmail.com)
3. Add your photo as `myimage.jpg` in the same folder as the HTML files
4. Update name, bio, GitHub/Facebook links in `index.html`
5. Add your live domain to Google OAuth authorised origins after deploying
6. Add a `favicon.ico` (optional but recommended)

---

## 📦 Deployment

This is a static HTML portfolio — deploy anywhere:

| Platform | How |
|----------|-----|
| Netlify | Drag the folder onto netlify.com/drop |
| GitHub Pages | Push to repo → Settings → Pages → Deploy from branch |
| Vercel | Connect GitHub repo, zero config |
| Any static host | Upload all files to the root directory |

After deploying, add your live URL to the Google OAuth Authorised JavaScript Origins.

---

## 🗄️ Storage (Supabase)

All content lives in Supabase (PostgreSQL + Storage):

- Tables: design, video, violin, competitions, blog, projects
- Audio files stored in Supabase Storage bucket (up to 50MB per file)
- Images auto-compressed to WebP at max 900x900px / 78% quality
- 30-second in-memory cache — panel switching is instant on repeat visits

The Supabase anon key in db.js is safe to be public. It only allows reads.
Writes are protected by Supabase Row Level Security (RLS).

---

## 🔒 Security Summary

| Layer | How |
|-------|-----|
| Admin access | Google OAuth — only one whitelisted Gmail can unlock |
| Session | 8-hour TTL in sessionStorage (auto-clears when tab closes) |
| XSS | All user content uses sanitizeHTML() / escAttr() — no raw innerHTML from user input |
| URLs | Only https://, http://, data:image/ are accepted |
| Files | Type whitelist + 10MB image limit + 50MB audio limit |
| SEO | noindex, nofollow on admin.html so search engines skip it |
