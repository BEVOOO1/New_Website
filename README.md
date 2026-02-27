# Bavly Badr Portfolio — v4

A publish-ready personal portfolio CMS built with vanilla HTML/CSS/JS.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Homepage |
| `design.html` | Church design gallery |
| `video.html` | Video works |
| `violin.html` | Violin performances |
| `projects.html` | Software projects |
| `competitions.html` | Competitions |
| `blog.html` | Blog posts |
| `admin.html` | Admin CMS (PIN protected) |
| `shared.css` | Global design system |
| `shared.js` | Canvas, nav, reveal, utilities |
| `db.js` | Storage layer + image optimization |

## What Was Optimized (v4)

### Security
- **Admin PIN lock** — Admin panel requires a PIN before access. Session expires after 2 hours.
  - **Change the PIN** in `admin.html` at `const ADMIN_PIN = '2025';` before publishing
- **XSS protection** — All user content rendered via `sanitizeHTML()` / `escAttr()` helpers
- **Input validation** — URL sanitizer, file type whitelist, max file size enforcement
- **`noindex` meta** on admin.html (search engines won't index it)

### Optimized File Uploads
- Images are **auto-compressed on upload** using Canvas API (max 1200×1200, WebP output)
- Files capped at **10MB** input with meaningful error messages
- Only allowed: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Compressed size shown to user after upload
- Drag-and-drop support on upload zones

### Performance
- Canvas animation **pauses** when tab is hidden (saves CPU/battery)
- **Lazy loading** on all gallery images (`loading="lazy"`)
- `ResizeObserver` instead of `window.resize` for canvas
- `will-change: transform` on canvas for GPU compositing
- `prefers-reduced-motion` respected — animations disabled when user prefers it
- Passive scroll listeners

### Code Quality
- `'use strict'` mode in admin.html
- Table search filter using `data-search` attributes (no re-render)
- Save button disabled while saving (prevents double-submit)
- Save includes try/catch with error toast
- Tags capped at 20, features at 20 lines (prevents storage bloat)
- JSON export includes date in filename

## Deployment

This is a static HTML portfolio — deploy to:
- **Netlify** (drag the folder onto netlify.com/drop)
- **GitHub Pages** (push to a repo, enable Pages)
- **Vercel** (connect GitHub repo)
- **Any static host**

### Before Publishing Checklist
1. Change `const ADMIN_PIN = '2025';` in `admin.html` to your own PIN
2. Add your photo as `myimage.jpg` in the same folder
3. Update the name, bio, and social links in `index.html`
4. (Optional) Add a `favicon.ico`

## Storage
Data is stored in `window.storage` (persistent in the Claude.ai artifact environment) with `localStorage` as fallback for regular browsers.
